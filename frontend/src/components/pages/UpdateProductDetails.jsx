import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  Autocomplete,
} from "@mui/material";
import bgImg from "../../img/back.png";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from "@mui/lab/TimelineOppositeContent";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import abi from "../../utils/Identeefi.json";
import useAuth from "../../hooks/useAuth";
import { ethers } from "ethers";

const options = ["true", "false"];

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();
    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      return null;
    }
    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      return accounts[0];
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const UpdateProductDetails = () => {
  // State for blockchain-related and product fields (from product table)
  const [currentAccount, setCurrentAccount] = useState("");
  const [currDate, setCurrDate] = useState("");
  const [currLatitude, setCurrLatitude] = useState("");
  const [currLongtitude, setCurrLongtitude] = useState("");
  const [currName, setCurrName] = useState("");
  const [currLocation, setCurrLocation] = useState("Fetching location...");
  const [serialNumber, setSerialNumber] = useState("");
  const [isSold, setIsSold] = useState(false);
  const [loading, setLoading] = useState("");

  // Blockchain contract details
  const CONTRACT_ADDRESS = "0x5BaAd2F8d16f2c32243aA12Dcb3bfE7D1ea67504";
  const CONTRACT_ABI = abi.abi;

  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qrData = location.state?.qrData;

  // On mount: parse QR data and get blockchain account.
  useEffect(() => {
    if (qrData) {
      // Expected format: "someValue,serialNumber"
      const data = qrData.split(",");
      const serial = data[1];
      setSerialNumber(serial);
    }
    findMetaMaskAccount().then((account) => {
      if (account) setCurrentAccount(account);
    });
  }, [qrData]);

  // On mount: fetch profile name and current time/location.
  useEffect(() => {
    getUsername();
    getCurrentTimeLocation();
  }, []);

  // Updated location code using Nominatim
  const fetchLocation = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            "User-Agent": "TestReactApp/1.0 (test@example.com)",
          },
        } // Replace with your email
      );
      const data = await response.json();
      setCurrLocation(
        data.display_name
          ? data.display_name.replace(/,/g, ";")
          : "Location not found"
      );
    } catch (error) {
      setCurrLocation("Failed to fetch location");
      console.error("Error fetching location:", error);
    }
  };

  useEffect(() => {
    if (currLatitude && currLongtitude) {
      fetchLocation(currLatitude, currLongtitude);
    }
  }, [currLatitude, currLongtitude]);

  const getCurrentTimeLocation = () => {
    setCurrDate(dayjs().unix());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrLatitude(position.coords.latitude);
          setCurrLongtitude(position.coords.longitude);
        },
        (error) => {
          setCurrLocation("Geolocation denied");
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setCurrLocation("Geolocation not supported");
      console.error("Geolocation not supported by browser");
    }
  };

  const getUsername = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/profile/${auth.user}`);
      if (res.data && res.data[0]) {
        setCurrName(res.data[0].name);
      }
    } catch (error) {
      console.error("Error fetching username:", error);
    }
  };

  // Function to update product details (blockchain call + DB record)
  const updateProduct = async (e) => {
    e.preventDefault();
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const productContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        console.log("Initiating blockchain update...");

        // Call blockchain function to add a new history record
        const registerTxn = await productContract.addProductHistory(
          serialNumber,
          currName,
          currLocation,
          currDate.toString(),
          Boolean(isSold)
        );
        setLoading("Mining (Add Product History) ... " + registerTxn.hash);
        await registerTxn.wait();
        setLoading("Mined (Add Product History) -- " + registerTxn.hash);

        // Now also store this update in the product_history table via the backend.
        await axios.post(
          "http://localhost:5000/addproduct_history",
          {
            serialNumber: serialNumber,
            actor: currName,
            location: currLocation,
            timestamp: currDate,
            is_sold: isSold,
          },
          { headers: { "Content-Type": "application/json" } }
        );

        setLoading("Done! Product details updated successfully!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setLoading("Error updating product");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(
      "Please pay the transaction fee to update the product details..."
    );
    await updateProduct(e);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // For demonstration, we assume the product details (name, etc.) are already displayed on this page.
  // You can add additional TextFields if needed.
  return (
    <Box
      sx={{
        backgroundImage: `url(${bgImg})`,
        minHeight: "80vh",
        backgroundRepeat: "no-repeat",
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundSize: "cover",
        zIndex: -2,
        overflowY: "scroll",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "400px",
          margin: "auto",
          marginTop: "10%",
          marginBottom: "10%",
          padding: "3%",
          backgroundColor: "#e3eefc",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            textAlign: "center",
            marginBottom: "3%",
            fontFamily: "Gambetta",
            fontWeight: "bold",
            fontSize: "2.5rem",
          }}
        >
          Update Product Details
        </Typography>

        <TextField
          fullWidth
          margin="normal"
          label="Serial Number"
          disabled
          value={serialNumber}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Name"
          disabled
          value={currName}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Location"
          disabled
          multiline
          minRows={2}
          value={currLocation.replace(/;/g, ",")}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Date"
          disabled
          value={dayjs(currDate * 1000).format("MMMM D, YYYY h:mm A")}
        />

        <Autocomplete
          disablePortal
          id="combo-box-demo"
          options={options}
          fullWidth
          value={isSold}
          onChange={(event, newVal) => {
            setIsSold(newVal);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              margin="normal"
              label="Is Sold?"
              variant="outlined"
            />
          )}
        />

        {loading !== "" && (
          <Typography
            variant="body2"
            sx={{ textAlign: "center", marginTop: "3%" }}
          >
            {loading}
          </Typography>
        )}

        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Button
            variant="contained"
            type="submit"
            onClick={handleSubmit}
            sx={{
              textAlign: "center",
              width: "50%",
              marginTop: "3%",
              backgroundColor: "#98b5d5",
              "&:hover": { backgroundColor: "#618dbd" },
            }}
          >
            Update Product
          </Button>
        </Box>

        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Button onClick={handleBack} sx={{ marginTop: "5%" }}>
            Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default UpdateProductDetails;
