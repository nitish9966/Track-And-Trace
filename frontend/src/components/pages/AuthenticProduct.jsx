import { Box, Paper, Typography, Button } from "@mui/material";
import bgImg from "../../img/back.png";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Utility function to access the Ethereum object
const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();

    if (!ethereum) {
      console.error("MetaMask not detected. Please install MetaMask!");
      return null;
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });
    if (accounts.length > 0) {
      return accounts[0]; // Return the first account found
    } else {
      console.warn("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching MetaMask account:", error);
    return null;
  }
};

const AuthenticProduct = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const qrData = location.state?.qrData;

  useEffect(() => {
    findMetaMaskAccount().then((account) => {
      if (account) {
        setCurrentAccount(account);
      }
    });
  }, []);

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("MetaMask is required to connect your wallet.");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        console.log("Wallet connected:", accounts[0]);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  useEffect(() => {
    if (currentAccount && qrData) {
      navigate("/product", { state: { qrData } });
    }
  }, [currentAccount, qrData, navigate]);

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
          variant="h4"
          sx={{
            fontFamily: "Montserrat",
            textAlign: "center",
            marginBottom: "5%",
            marginTop: "5%",
          }}
        >
          Congrats!
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontFamily: "Montserrat",
            textAlign: "center",
            marginBottom: "5%",
            marginTop: "5%",
          }}
        >
          Your Product is Authentic
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            marginTop: "10%",
            marginBottom: "5%",
          }}
        >
          Connect Your Wallet to View Product Details
        </Typography>

        <Button
          variant="contained"
          sx={{ width: "100%", marginTop: "5%" }}
          onClick={connectWallet}
        >
          Connect Wallet
        </Button>
      </Paper>
    </Box>
  );
};

export default AuthenticProduct;
