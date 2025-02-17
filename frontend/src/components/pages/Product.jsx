import { Box, Paper, Avatar, Typography, Button } from "@mui/material";
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

const Product = () => {
  // State for product details from the product table
  const [serialNumber, setSerialNumber] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [isSold, setIsSold] = useState(false);
  const [image, setImage] = useState({ file: [], filepreview: null });

  // State for product history from the product_history table
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const qrData = location.state?.qrData;

  // When component mounts (or qrData changes), fetch product details and history.
  useEffect(() => {
    if (qrData) {
      handleScan(qrData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrData]);

  // Helper to build the image URL based on the filename from the backend.
  const getImage = async (imageName) => {
    setImage((prevState) => ({
      ...prevState,
      filepreview: `http://localhost:5000/file/product/${imageName}`,
    }));
  };

  // Fetch product details from the product table.
  const handleScan = async (qrData) => {
    // Assuming qrData is in the format "someValue,serialNumber"
    const data = qrData.split(",");
    const serial = data[1];
    setSerialNumber(serial);

    try {
      const response = await axios.get(
        `http://localhost:5000/product/${serial}`
      );
      if (response.status === 200) {
        const product = response.data;
        await setProductData(product);
      } else {
        console.error("Failed to fetch product details:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  // Update state with product details and fetch history separately.
  const setProductData = async (product) => {
    setName(product.name || "");
    setBrand(product.brand || "");
    setDescription(product.description || "");
    setSerialNumber(product.serialNumber || "");
    // Do not immediately set isSold; update it after fetching history.
    getImage(product.image || `${product.serialNumber}.png`);

    // Now fetch product history from the product_history table.
    try {
      const historyRes = await axios.get(
        `http://localhost:5000/product_history/${product.serialNumber}`
      );
      if (historyRes.status === 200) {
        // Sort the history records in ascending order (oldest first)
        const sortedHistory = historyRes.data.sort(
          (a, b) => a.timestamp - b.timestamp
        );
        setHistory(sortedHistory);
        // If there is at least one history record, update isSold from the last record.
        if (sortedHistory.length > 0) {
          setIsSold(sortedHistory[sortedHistory.length - 1].is_sold);
        } else {
          // Fallback to the product's isSold value.
          setIsSold(product.is_sold || product.isSold || false);
        }
      } else {
        console.error(
          "Failed to fetch product history:",
          historyRes.statusText
        );
        setHistory([]);
        setIsSold(product.is_sold || product.isSold || false);
      }
    } catch (error) {
      console.error("Error fetching product history:", error);
      setHistory([]);
      setIsSold(product.is_sold || product.isSold || false);
    }
  };

  // Render the product history timeline.
  const getHistory = () => {
    return history.map((item, index) => {
      const ts = item.timestamp ? Number(item.timestamp) : 0;
      const date = dayjs(ts * 1000).format("MM/DD/YYYY");
      const time = dayjs(ts * 1000).format("HH:mm a");
      return (
        <TimelineItem key={index}>
          <TimelineOppositeContent color="textSecondary">
            {time} {date}
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
      );
    });
  };

  const handleBack = () => {
    navigate(-2);
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${bgImg})`,
        minHeight: "80vh",
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
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
          variant="body2"
          sx={{ textAlign: "center", marginTop: "3%" }}
        >
          Your Product is Authentic!
        </Typography>
        <Box sx={{ textAlign: "center", marginBottom: "5%" }}>
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
            Product Details
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "100%",
              marginTop: "5%",
              marginBottom: "5%",
            }}
          >
            <Box
              sx={{
                marginRight: "1.5%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "35%",
              }}
            >
              <Avatar
                alt={name}
                src={image.filepreview}
                sx={{
                  width: 100,
                  height: 100,
                  marginBottom: "3%",
                  backgroundColor: "#3f51b5",
                }}
              >
                {name}
              </Avatar>
            </Box>
            <Box
              sx={{
                marginLeft: "1.5%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "65%",
              }}
            >
              <Typography
                variant="body1"
                sx={{ textAlign: "left", marginBottom: "5%" }}
              >
                Name: {name}
              </Typography>
              <Typography
                variant="body2"
                sx={{ textAlign: "left", marginBottom: "3%" }}
              >
                Serial Number: {serialNumber}
              </Typography>
              <Typography
                variant="body2"
                sx={{ textAlign: "left", marginBottom: "3%" }}
              >
                Description: {description}
              </Typography>
              <Typography
                variant="body2"
                sx={{ textAlign: "left", marginBottom: "3%" }}
              >
                Brand: {brand}
              </Typography>
            </Box>
          </Box>

          <Timeline
            sx={{
              [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2 },
            }}
          >
            {getHistory()}
            <TimelineItem>
              <TimelineOppositeContent color="textSecondary">
                {dayjs().format("HH:mm a")} {dayjs().format("MM/DD/YYYY")}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot />
              </TimelineSeparator>
              <TimelineContent sx={{ py: "12px", px: 2 }}>
                <Typography>IsSold: {isSold.toString()}</Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>

          {loading !== "" && (
            <Typography
              variant="body2"
              sx={{ textAlign: "center", marginTop: "3%" }}
            >
              {loading}
            </Typography>
          )}

          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            {/* Conditionally show the Update Product button only if the last history record's is_sold is false */}
            {history.length === 0 ||
            history[history.length - 1].is_sold !== true ? (
              <Button
                variant="contained"
                type="submit"
                sx={{
                  width: "50%",
                  marginTop: "3%",
                  backgroundColor: "#98b5d5",
                  "&:hover": { backgroundColor: "#618dbd" },
                }}
                onClick={() =>
                  navigate("/update-product-details", { state: { qrData } })
                }
              >
                Update Product
              </Button>
            ) : null}
          </Box>

          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Button onClick={handleBack} sx={{ marginTop: "5%" }}>
              Back
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Product;
