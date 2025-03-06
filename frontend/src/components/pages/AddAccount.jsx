import "../../css/Role.css";
import {
  TextField,
  Box,
  Paper,
  Typography,
  Autocomplete,
  Button,
} from "@mui/material";
import React, { useRef, useState, useEffect } from "react";
import bgImg from "../../img/back.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const options = ["manufacturer", "supplier", "retailer"];

const AddAccount = () => {
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [role, setRole] = useState(options[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("Fetching location...");
  const [errMsg, setErrMsg] = useState("");
  const [image, setImage] = useState({ file: [], filepreview: null });

  const errRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd]);

  // Function to fetch location name using Nominatim API
  const fetchLocation = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "TestReactApp/1.0 (test@example.com)", // Replace with your app name and email
          },
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setLocation(data.display_name); // Set human-readable address
      } else {
        setLocation(""); // Allow manual entry if no result
        setErrMsg("Location not found. Please enter manually.");
      }
    } catch (error) {
      setLocation(""); // Allow manual entry on error
      setErrMsg("Failed to fetch location. Please enter manually.");
    }
  };

  // Get geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchLocation(latitude, longitude);
        },
        (error) => {
          setLocation(""); // Allow manual entry if denied
          setErrMsg(
            "Geolocation access denied. Please enter location manually."
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocation(""); // Allow manual entry if unsupported
      setErrMsg("Geolocation not supported. Please enter location manually.");
    }
  }, []);

  const handleImage = (e) => {
    setImage({
      ...image,
      file: e.target.files[0],
      filepreview: URL.createObjectURL(e.target.files[0]),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const accountData = JSON.stringify({
        username: user,
        password: pwd,
        role: role,
      });

      const profileData = JSON.stringify({
        username: user,
        name: name,
        description: description,
        website: website,
        location: location, // Use the fetched or manually entered location
        image: image.file.name,
        role: role,
      });

      await axios.post("http://localhost:5000/addaccount", accountData, {
        headers: { "Content-Type": "application/json" },
      });

      await axios.post("http://localhost:5000/addprofile", profileData, {
        headers: { "Content-Type": "application/json" },
      });

      setUser("");
      setPwd("");
      setPwd2("");
      setRole(options[0]);
      setName("");
      setDescription("");
      setWebsite("");
      setLocation("Fetching location..."); // Reset to fetch again on next load
      setImage({ file: [], filepreview: null });
    } catch (err) {
      setErrMsg("Something went wrong. Try again.");
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${bgImg})`,
        minHeight: "100vh",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
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
        <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"}>
          {errMsg}
        </p>

        <Typography
          variant="h2"
          sx={{ textAlign: "center", marginBottom: "3%", fontSize: "2.5rem" }}
        >
          Add Account
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Username"
            variant="outlined"
            onChange={(e) => setUser(e.target.value)}
            value={user}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            type="password"
            variant="outlined"
            onChange={(e) => setPwd(e.target.value)}
            value={pwd}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Confirm Password"
            type="password"
            variant="outlined"
            onChange={(e) => setPwd2(e.target.value)}
            value={pwd2}
          />
          {pwd !== pwd2 && (
            <Typography
              variant="body2"
              sx={{ textAlign: "center", fontSize: "12px", color: "red" }}
            >
              Passwords do not match
            </Typography>
          )}

          <Autocomplete
            disablePortal
            options={options}
            fullWidth
            value={role}
            onChange={(event, newRole) => setRole(newRole)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                margin="normal"
                label="Role"
                variant="outlined"
              />
            )}
          />

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ marginTop: "3%" }}
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
            label="Description"
            variant="outlined"
            multiline
            minRows={2}
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Website"
            variant="outlined"
            onChange={(e) => setWebsite(e.target.value)}
            value={website}
          />

          {/* Editable Location Field */}
          <TextField
            fullWidth
            margin="normal"
            label="Location"
            variant="outlined"
            InputProps={{ readOnly: true }}
            disabled
            value={location}
            onChange={(e) => setLocation(e.target.value)} // Allow manual edits
            helperText="Automatically fetched or enter manually"
          />

          <Button
            variant="contained"
            type="submit"
            sx={{
              width: "100%",
              marginTop: "3%",
              backgroundColor: "#98b5d5",
              "&:hover": { backgroundColor: "#618dbd" },
            }}
          >
            Add Account
          </Button>

          <Box
            sx={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Button onClick={() => navigate(-1)} sx={{ marginTop: "5%" }}>
              Back
            </Button>
          </Box>
        </form>

        {/* OpenStreetMap Attribution */}
        <Typography
          variant="body2"
          sx={{ textAlign: "center", marginTop: "2%", fontSize: "0.8rem" }}
        >
          Location data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap contributors
          </a>
        </Typography>
      </Paper>
    </Box>
  );
};

export default AddAccount;
