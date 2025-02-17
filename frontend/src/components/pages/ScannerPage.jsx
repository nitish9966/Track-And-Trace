import { Box, Paper, Typography, Button } from "@mui/material";
import bgImg from "../../img/scanner.jpg";
import QrScanner from "../QrScanner";
import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const ScannerPage = () => {
  const CONTRACT_ADDRESS = "0x5BaAd2F8d16f2c32243aA12Dcb3bfE7D1ea67504";
  const [qrData, setQrData] = useState("");

  const { auth } = useAuth();
  const navigate = useNavigate();

  const passData = (data) => {
    if (data) {
      console.log("Scanned Data:", data);
      setQrData(data);
    }
  };

  useEffect(() => {
    if (!qrData) return; // Prevent running if qrData is empty

    console.log("Auth Info:", auth);
    console.log("QR Data:", qrData);

    const arr = qrData.split(",");
    if (arr.length === 0) return; // Prevent errors if QR code is invalid

    const contractAddress = arr[0];

    if (contractAddress === CONTRACT_ADDRESS) {
      if (auth.role === "supplier" || auth.role === "retailer") {
        navigate("/update-product", { state: { qrData } });
      } else {
        navigate("/authentic-product", { state: { qrData } });
      }
    } else {
      navigate("/fake-product");
    }
  }, [qrData, auth, navigate]);

  const handleBack = () => {
    navigate(-1);
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
          backgroundColor: "#ABEBC6",
        }}
      >
        <Box sx={{ textAlign: "center", marginBottom: "5%" }}>
          <Typography
            variant="h2"
            sx={{
              textAlign: "center",
              marginBottom: "3%",
              fontFamily: "Gambetta",
              fontWeight: "bold",
              fontSize: "2.5rem",
              color: "black",
            }}
          >
            Scan QR Code
          </Typography>

          {/* QR Scanner Component */}
          <QrScanner passData={passData} />

          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Button
              onClick={handleBack}
              sx={{ marginTop: "5%", fontWeight: "bold" }}
            >
              Back
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ScannerPage;
