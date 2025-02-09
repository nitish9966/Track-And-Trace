import { Box, Paper, Avatar, Typography, Button } from "@mui/material";
import bgImg from "../../img/bg.png";
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
import abi from "../../utils/Identeefi.json";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x5BaAd2F8d16f2c32243aA12Dcb3bfE7D1ea67504";
const CONTRACT_ABI = abi.abi;

const Product = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [name, setName] = useState("P");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [history, setHistory] = useState([]);
  const [isSold, setIsSold] = useState(false);
  const [image, setImage] = useState({ filepreview: null });

  const navigate = useNavigate();
  const location = useLocation();
  const qrData = location.state?.qrData;

  useEffect(() => {
    const checkMetaMask = async () => {
      if (!window.ethereum) {
        console.error("MetaMask is required!");
        return;
      }
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        }
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    };
    checkMetaMask();
    if (qrData) handleScan(qrData);
  }, [qrData]);

  const handleScan = async (qrData) => {
    try {
      const [contractAddress, serial] = qrData.split(",");
      if (contractAddress !== CONTRACT_ADDRESS) {
        console.error("Invalid contract address");
        return;
      }
      setSerialNumber(serial);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const productContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      const product = await productContract.getProduct(serial);
      updateProductData(product);
    } catch (error) {
      console.error("Error fetching product data:", error);
    }
  };

  const updateProductData = (data) => {
    const arr = data.split(",");
    setName(arr[1]);
    setBrand(arr[2]);
    setDescription(arr[3].replace(/;/g, ","));
    setImage({ filepreview: `http://localhost:5000/file/product/${arr[4]}` });
    const historyData = [];
    for (let i = 5; i < arr.length; i += 5) {
      historyData.push({
        actor: arr[i + 1],
        location: arr[i + 2].replace(/;/g, ","),
        timestamp: arr[i + 3],
        isSold: arr[i + 4] === "true",
      });
    }
    setHistory(historyData);
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${bgImg})`,
        minHeight: "80vh",
        backgroundSize: "cover",
        overflowY: "scroll",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "400px",
          margin: "auto",
          padding: "3%",
          backgroundColor: "#e3eefc",
        }}
      >
        <Typography
          variant="body2"
          sx={{ textAlign: "center", marginTop: "3%" }}
        >
          Your Product is Authentic!
        </Typography>
        <Box sx={{ textAlign: "center", marginBottom: "5%" }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "Gambetta",
              fontWeight: "bold",
              fontSize: "2.5rem",
            }}
          >
            Product Details
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", marginTop: "5%" }}>
            <Avatar
              alt={name}
              src={image.filepreview}
              sx={{ width: 100, height: 100, marginBottom: "3%" }}
            >
              {name}
            </Avatar>
            <Box sx={{ marginLeft: "1.5%" }}>
              <Typography variant="body1">{name}</Typography>
              <Typography variant="body2">
                Serial Number: {serialNumber}
              </Typography>
              <Typography variant="body2">
                Description: {description}
              </Typography>
              <Typography variant="body2">Brand: {brand}</Typography>
            </Box>
          </Box>
          <Timeline
            sx={{
              [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2 },
            }}
          >
            {history.map((item, index) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent color="textSecondary">
                  {dayjs(item.timestamp * 1000).format("HH:mm a MM/DD/YYYY")}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: "12px", px: 2 }}>
                  <Typography>Location: {item.location}</Typography>
                  <Typography>Actor: {item.actor}</Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
          <Button onClick={() => navigate(-2)} sx={{ marginTop: "5%" }}>
            Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Product;
