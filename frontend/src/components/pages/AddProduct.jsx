import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
} from "@mui/material";
import bgImg from "../../img/back.png";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import abi from "../../utils/Identeefi.json";
import QRCode from "qrcode.react";
import dayjs from "dayjs";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();
    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      alert("Make sure you have Metamask!");
      return null;
    }
    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length !== 0) {
      return accounts[0];
    } else {
      const newAccounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      return newAccounts.length > 0 ? newAccounts[0] : null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

const AddProduct = () => {
  // Product details state
  const [currentAccount, setCurrentAccount] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState({ file: [], filepreview: null });
  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState("");

  // Manufacturer details (from profile/geolocation)
  const [manuDate, setManuDate] = useState("");
  const [manuLatitude, setManuLatitude] = useState("");
  const [manuLongtitude, setManuLongtitude] = useState(""); // Keeping original naming for consistency
  const [manuName, setManuName] = useState("");
  const [manuLocation, setManuLocation] = useState("Fetching location...");

  // For uniqueness check
  const [isUnique, setIsUnique] = useState(true);

  // Blockchain contract details
  const CONTRACT_ADDRESS = "0x5BaAd2F8d16f2c32243aA12Dcb3bfE7D1ea67504";
  const contractABI = abi.abi;

  const { auth } = useAuth();
  const navigate = useNavigate();

  // On mount, get user info and geolocation
  useEffect(() => {
    const getUsername = async () => {
      if (!auth?.user) {
        console.warn("⚠️ No user found in auth. Skipping API call.");
        return;
      }
      try {
        console.log(`🔍 Fetching username for: ${auth.user}`);
        const res = await axios.get(
          `http://localhost:5000/profile/${auth.user}`
        );
        if (res.data && res.data[0] && res.data[0].name) {
          setManuName(res.data[0].name);
        } else {
          setManuName(auth.user);
        }
      } catch (error) {
        console.error(
          "❌ Error fetching username:",
          error.response?.data || error.message
        );
        setManuName(auth.user);
      }
    };

    const fetchData = async () => {
      try {
        const account = await findMetaMaskAccount();
        if (account) setCurrentAccount(account);
        await getUsername();
        getCurrentTimeLocation();
      } catch (error) {
        console.error("❌ Error in fetchData:", error);
      }
    };

    fetchData();
  }, [auth?.user]);

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
      setManuLocation(
        data.display_name
          ? data.display_name.replace(/,/g, ";")
          : "Location not found"
      );
    } catch (error) {
      setManuLocation("Failed to fetch location");
      console.error("Error fetching location:", error);
    }
  };

  useEffect(() => {
    if (manuLatitude && manuLongtitude) {
      fetchLocation(manuLatitude, manuLongtitude);
    }
  }, [manuLatitude, manuLongtitude]);

  const getCurrentTimeLocation = () => {
    setManuDate(dayjs().unix());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setManuLatitude(position.coords.latitude);
          setManuLongtitude(position.coords.longitude);
        },
        (error) => {
          setManuLocation("Geolocation denied");
          console.error("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setManuLocation("Geolocation not supported");
      console.error("Geolocation not supported by browser");
    }
  };

  // Generate QR Code data
  const generateQRCode = async (serialNumber) => {
    const data = CONTRACT_ADDRESS + "," + serialNumber;
    setQrData(data);
    console.log("QR Code: ", data);
  };

  const downloadQR = () => {
    const canvas = document.getElementById("QRCode");
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${serialNumber}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleImage = async (e) => {
    setImage({
      ...image,
      file: e.target.files[0],
      filepreview: URL.createObjectURL(e.target.files[0]),
    });
  };

  const uploadImage = async (image) => {
    const data = new FormData();
    data.append("image", image.file);
    try {
      const res = await axios.post(
        "http://localhost:5000/upload/product",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Image upload response:", res.data);
    } catch (err) {
      console.error("Image upload error:", err);
    }
  };

  const addProductDB = async () => {
    try {
      const productData = JSON.stringify({
        serialNumber: serialNumber,
        name: name,
        brand: brand,
        description: description,
        image: image.file.name,
      });
      const res = await axios.post(
        "http://localhost:5000/addproduct",
        productData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Product DB response:", res.data);
    } catch (err) {
      console.error("Error adding product to DB:", err);
    }
  };

  const addProductHistoryDB = async () => {
    try {
      const productHistoryData = JSON.stringify({
        serialNumber: serialNumber,
        actor: manuName,
        location: manuLocation,
        timestamp: manuDate,
        is_sold: false,
      });
      console.log("Adding product history with:", productHistoryData);
      const res = await axios.post(
        "http://localhost:5000/addproduct_history",
        productHistoryData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Product history added:", res.data);
    } catch (err) {
      console.error("Error adding product history:", err);
    }
  };

  const registerProduct = async (e) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const productContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        const registerTxn = await productContract.registerProduct(
          name,
          brand,
          serialNumber,
          description.replace(/,/g, ";"),
          image.file.name,
          manuName,
          manuLocation,
          manuDate.toString()
        );
        console.log("Mining (Registering Product) ...", registerTxn.hash);
        setLoading("Mining (Register Product) ... " + registerTxn.hash);
        await registerTxn.wait();
        console.log("Mined (Register Product) --", registerTxn.hash);
        setLoading("Mined (Register Product) -- " + registerTxn.hash);
        generateQRCode(serialNumber);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log("Error in blockchain registration:", error);
    }
  };

  const checkUnique = async () => {
    try {
      const res = await axios.get("http://localhost:5000/product/serialNumber");
      const existingSerialNumbers = res.data.map(
        (product) => product.serialnumber
      );
      const isDuplicate = existingSerialNumbers.includes(serialNumber);
      setIsUnique(!isDuplicate);
      console.log("Existing serials:", existingSerialNumbers);
      console.log("isUnique: ", !isDuplicate);
    } catch (error) {
      console.error("Error checking uniqueness:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting product:");
    console.log("Name:", name);
    console.log("Brand:", brand);
    console.log("Description:", description);
    console.log("Image:", image.file.name);
    console.log("Serial Number:", serialNumber);
    console.log("Manufacture date:", manuDate);
    console.log("Manufactured at:", manuLocation);
    console.log("Manufactured by:", manuName);

    await checkUnique();

    if (isUnique) {
      await uploadImage(image);
      await addProductDB();
      await addProductHistoryDB();
      setLoading(
        "Please pay the transaction fee to update the product details..."
      );
      await registerProduct(e);
    } else {
      setLoading(
        "Serial Number already exists. Please use a unique serial number."
      );
    }

    setIsUnique(true);
  };

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
          Add Product
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            error={!isUnique}
            helperText={!isUnique ? "Serial Number already exists" : ""}
            margin="normal"
            label="Serial Number"
            variant="outlined"
            onChange={(e) => setSerialNumber(e.target.value)}
            value={serialNumber}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            variant="outlined"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Brand"
            variant="outlined"
            onChange={(e) => setBrand(e.target.value)}
            value={brand}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            variant="outlined"
            multiline
            minRows={2}
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ marginTop: "3%", marginBottom: "3%" }}
          >
            Upload Image
            <input type="file" hidden onChange={handleImage} />
          </Button>
          {image.filepreview && (
            <img
              src={image.filepreview}
              alt="preview"
              style={{ width: "100%", height: "100%" }}
            />
          )}
          {qrData !== "" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "3%",
              }}
            >
              <QRCode value={qrData} id="QRCode" />
            </div>
          )}
          {qrData !== "" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "3%",
              }}
            >
              <Button
                variant="outlined"
                fullWidth
                sx={{ marginTop: "3%", marginBottom: "3%" }}
                onClick={downloadQR}
              >
                Download QR Code
              </Button>
            </div>
          )}
          {loading && (
            <Typography
              variant="body2"
              sx={{ textAlign: "center", marginTop: "3%" }}
            >
              {loading}
            </Typography>
          )}
          <Button
            variant="contained"
            type="submit"
            fullWidth
            sx={{
              marginTop: "3%",
              backgroundColor: "#98b5d5",
              "&:hover": { backgroundColor: "#618dbd" },
            }}
            onClick={getCurrentTimeLocation}
          >
            Add Product
          </Button>
          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Button onClick={handleBack} sx={{ marginTop: "5%" }}>
              Back
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddProduct;
