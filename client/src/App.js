import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Container,
  InputGroup,
  FormControl,
  Button,
  Row,
  Card,
  ListGroup,
} from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import searchLogo from './resources/img/loupe.png';
import githubLogo from './resources/img/github.png';

var SpotifyWebApi = require("spotify-web-api-node");

document.body.style.backgroundColor = "#191414";

// Spotify Authentication Keys
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

// Credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: "https://spotifycovers.com/",
});

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Main app functions
function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);

  // Reference for the input field
  const inputRef = useRef(null);

  useEffect(() => {
    var authParameters = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=client_credentials&client_id=" +
        CLIENT_ID +
        "&client_secret=" +
        CLIENT_SECRET,
    };
    fetch("https://accounts.spotify.com/api/token", authParameters)
      .then((result) => result.json())
      .then((data) => setAccessToken(data.access_token));
  }, []);

  // Artist searching function
  async function search(artistID) {
    var searchParameters = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    await fetch(
      "https://api.spotify.com/v1/artists/" +
        artistID +
        "/albums" +
        "?include_groups=album&market=US&limit=50",
      searchParameters
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setAlbums(data.items);
        setArtistSuggestions([]);
        setSearchExecuted(true);
      });
  }

  // Artists suggestions function
  async function getArtistSuggestions(query) {
    if (!query) {
      setArtistSuggestions([]);
      return;
    }

    var searchParameters = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    await fetch(
      "https://api.spotify.com/v1/search?q=" + query + "&type=artist",
      searchParameters
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.artists) {
          setArtistSuggestions(data.artists.items.slice(0, 10));
        }
      });
  }

  // download image function
  function downloadImage(url, filename) {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.jpg`;
        document.body.appendChild(link);
        link.click(); // simulate a click on the link to start download
        document.body.removeChild(link); // clean element after download
      })
      .catch((error) => console.error("Error downloading the image:", error));
  }

  return (
    <div className="App-container">
      <Container className="text-center py-3 title">
        <a href="https://spotifycovers.com" style={{ textDecoration: "none" }} ><h1>Spotify Covers</h1></a>
      </Container>

      <Container className="py-5" style={{ position: "relative" }}>
        <div className="d-flex justify-content-center">
          <InputGroup
            className={`mb-3 py-0 search-input-group ${isSearchActive ? "active" : ""}`}
            size="lg"
            style={{ transition: "width 0.3s ease-in-out", width: isSearchActive ? "60%" : "50%" }}
          >
            <FormControl
              ref={inputRef}
              placeholder="Research an artist"
              type="input"
              style={{ borderRadius: "25px 0 0 25px" }}
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                getArtistSuggestions(event.target.value);
              }}
              onFocus={() => setIsSearchActive(true)}
              onBlur={() => setIsSearchActive(false)}
            />
            <span
              className="clear-btn"
              onClick={() => {
                setSearchInput(""); // Reset state
                inputRef.current.value = ""; // Clear input field
                setArtistSuggestions([]); // Clear suggestions
              }}
            >
              &times;
            </span>
            <Button
              onClick={() => {
                if (artistSuggestions.length > 0) {
                  search(artistSuggestions[0].id);
                }
              }}
              style={{
                backgroundColor: "#1DB954",
                borderColor: "#1DB954",
                color: "#191414",
                borderRadius: "0 25px 25px 0",
              }}
            >
              <img src={searchLogo} style={{ width: "35px" }} alt="search" />
            </Button>
          </InputGroup>
        </div>
        <div className="d-flex justify-content-center">
          {artistSuggestions.length > 0 && (
            <ListGroup
              className="suggestions-list"
              style={{
                backgroundColor: "#ffffff83",
                zIndex: "1000",
                position: "absolute",
                width: "58.8%",
                top: "70%",
                borderRadius: "25px",
              }}
            >
              {artistSuggestions.map((artist) => (
                <ListGroup.Item
                  key={artist.id}
                  className="suggestions-list-item"
                  action
                  onClick={() => {
                    search(artist.id);
                  }}
                >
                  {artist.name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      </Container>

      <Container>
        <Row className="row-cols-2 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
          {searchExecuted && albums.length === 0 ? (
            <div className="w-100 d-flex justify-content-center">
              <p className="text-center" style={{ color: "white", fontSize: "1.5rem" }}>
                No albums found
              </p>
            </div>
          ) : (
            albums.map((album, i) => {
              return (
                <Card
                  className="my-2 px-3 custom-card"
                  key={i}
                  style={{ backgroundColor: "transparent", border: "none" }}
                >
                  <Card.Img src={album.images[0].url} alt={album.name} />
                  <div className="card-info">
                    <h5>{album.name}</h5>
                    <button
                      className="download-btn"
                      onClick={() => {
                        if (isMobileDevice()) {
                          window.open(album.images[0].url, '_blank');
                        } else {
                          downloadImage(album.images[0].url, album.name);
                        }
                      }}
                    >
                      Download
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </Row>
      </Container>

      <footer
        className="text-center py-3"
        style={{
          color: "white",
          position: "fixed",
          left: 0,
          bottom: 0,
          width: "100%",
        }}
      >
        <p>
          Open source project - <a href="https://github.com/cyrilnapo/spotifycovers" target="_blank" rel="noreferrer" style={{ color: "white", textDecoration: "underline" }}>View on Github</a> <img src={githubLogo} alt="GitHub" style={{ width: "20px", marginBottom: "4px" }} />
        </p>
      </footer>
    </div>
  );
}

export default App;
