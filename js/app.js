/************ GLOBAL CONSTANTS ************/

const MUSIX_KEY = '06b4409f6ef339768789f20421155dad';
const GIPHY_KEY = "rgXdbqSnr24kKy3JgEjCAFctsgKCR4Zr"
const MUSIX_API = "https://api.musixmatch.com/ws/1.1/"
const GIPHY_API = "https://api.giphy.com/v1/gifs/"
const render_container = document.querySelector(".render-container");
const COLOR_THEMES = [
    {
        name: "goldsmiths",
        primary: "rgb(236,67,113)",
        secondary: "rgb(254,209,0)",
        textColor: "rgb(55,66,74)"
    },
    {
        name: "theatre",
        primary: "rgb(247, 79, 66)",
        secondary: "rgb(255, 199, 247)",
        textColor: "rgb(31, 59, 255)"
    },
    {
        name: "chiko",
        primary: "rgb(242, 240, 173)",
        secondary: "rgb(214, 165, 145)",
        textColor: "rgb(55, 60, 163)"
    },
    {
        name: "ambiguous",
        primary: "rgb(158, 189, 255)",
        secondary: "rgb(13, 25, 163)",
        textColor: "rgb(115, 255, 153)"
    },
    {
        name: "lequartier",
        primary: "rgb(0, 9, 127)",
        secondary: "rgb(255, 10, 0)",
        textColor: "rgb(252, 246, 239)"
    },
    {
        name: "holnap",
        primary: "rgb(58, 53, 206)",
        secondary: "rgb(237, 29, 36)",
        textColor: "rgb(255, 255, 255)"
    },
    {
        name: "prosail",
        primary: "rgb(255, 222, 230)",
        secondary: "rgb(255, 13, 51)",
        textColor: "rgb(82, 97, 255)"
    },
    {
        name: "mat",
        primary: "rgb(0, 107, 180)",
        secondary: "rgb(255, 204, 0)",
        textColor: "rgb(255, 255, 255)"
    },
    {
        name: "landsea",
        primary: "rgb(0, 107, 180)",
        secondary: "rgb(220, 196, 150)",
        textColor: "rgb(255, 255, 255)"
    },
]

/************ INITIAL STATES /************/

let CURRENT_THEME = "" // Variable to capture color themes when user switches views
let GIF_LYRICS = "";
let gridActive = false;
let setInitialState = true; // Variable to capture whether a user first visits or if a new song has been looked up

/************ SONG/TRACK METHODS ************/ 

// Get Lyrics from MusixMatch API. Returns string
// Requires CORS to use
const getLyrics = async (songName, artist) => {

    try {
        songName.replace(/\s/g, '%20');
        (artist)? artist.replace(/\s/g, '%20') : null;

        let response = await fetch(`https://cors-anywhere.herokuapp.com/${MUSIX_API}matcher.lyrics.get?q_track=${songName}&q_artist=${artist}&apikey=${MUSIX_KEY}`);

        const search_data = await response.json();
        const lyrics_raw = await search_data.message.body.lyrics.lyrics_body;
        const lyrics_clean = lyrics_raw.substring(0, lyrics_raw.indexOf("*"));
     
        return lyrics_clean;
    }   
    catch(err){
        console.error(err);
        render_container.innerHTML =  
        `<div class="lyrics-text--error">
        Could not find this track. Try another one.<br>
        </div>`
    }
}

// Get Song Info From MusixMatch API
const getSongTitleArtistName = async (songName, artist) => {
       /* Render artist, song and album on top */ 
       try {

            let response = await fetch(`https://cors-anywhere.herokuapp.com/${MUSIX_API}matcher.track.get?q_artist=${artist}&q_track=${songName}&apikey=${MUSIX_KEY}`)

            const track_match = await response.json();
            const track_name = track_match.message.body.track.track_name;
            const artist_name = track_match.message.body.track.artist_name;
            const album_name = track_match.message.body.track.album_name;

            let track_info = {
                track: track_name,
                artist: artist_name,
                album: album_name
            }
           
            renderTrackInfo(track_info)
       }
       catch(err){
            console.error(err, "could not find match");
            document.querySelector("track-info").innerHTML = 
            `<div class="lyrics-text--error">
            Could not load track info.<br>
            </div>`
       }
}

// Parse Lyrics using Compromise NLP Library
const parseLyrics = (lyrics_data) => {

    let lyrics = nlp(lyrics_data);

    // Create a keywords array
    const keywords = [];

    emptyArr= [];

    // Parse lyrics using Compromise
    const verbs = lyrics.verbs().not("#Infinitive").not("#Copula").not("#Auxiliary").json();
    const nouns = lyrics.nouns().not("#Possessive").json();
    const adjectives = lyrics.adjectives().json();
    const acronyms = lyrics.acronyms().json();
    const topics = lyrics.topics().json();
    const adverbs =  lyrics.adverbs().json();

    // Add to keyword list if it's a keyword
    nouns.forEach(noun => { keywords.push(noun.text)})
    verbs.forEach(verb => { keywords.push(verb.text)})
    adjectives.forEach(adjective => {keywords.push(adjective.text)})
    adverbs.forEach(adverb => {keywords.push(adverb.text)})
    topics.forEach(topic => {keywords.push(topic.text)})

    // Split all words into an array based on space 
    parsedLyrics = lyrics_data.split(/ +?/g);

    // Make the parsed word into an object if it's a keyword
    // This object contains a keyword value (i.e. the giphy search value), an html value (string with  <br>) and imgSrc (that will be populated by GIPHY Search)
    for (i = 0; i < parsedLyrics.length ; i++) {
        let htmlString = parsedLyrics[i].replace(/\r\n|\n|\r/gm, "<br>")
        let matchedWord = parsedLyrics[i].split(/(\r\n|\n|\r)/gm)[0];

        if (keywords.includes(matchedWord)) {
            parsedLyrics[i] = 
            {   
                value: matchedWord,
                htmlVal: htmlString,
                imgSrc: "",
                alt: ""
            }
        }
        else {
            parsedLyrics[i] = htmlString;
        }
    }    
  
   return parsedLyrics.filter(w => w != "");
}

const handleTrack = async (song, artist) => {
    setInitialState = true;
    render_container.innerHTML = ""; 
    const track = await getLyrics(song, artist);
    const parsed_track = parseLyrics(track);
    GIF_LYRICS = await assignGifs(parsed_track);

    renderView(GIF_LYRICS);
}


/************ IMG ASSIGNMENT METHODS ************/
const searchGif = async (searchTerm) => {
    const selection = Math.floor(Math.random() * 5);

    try {
        let response = await fetch(`${GIPHY_API}search?api_key=${GIPHY_KEY}&q=${searchTerm}&offset=${selection}`); // Regular Search
        
        /* [ALTERNATIVE] Random Search */
        //let response = await fetch(`${GIPHY_API}random?api_key=${GIPHY_KEY}&tag=${searchTerm}`);

        const giphy_data = await response.json();
        const gif_url = giphy_data.data[0].images.original.url // Regular Search Parse

        /* [ALTERNATIVE] Random Search Parse */
        //const gif_url = giphy_data.data.images.original.url; // [ALTERNATIVE] Random GIF Parse

        return gif_url
    }   

    catch(err){
        console.error(err);

        // Return blank string if no gif exists
        return ""
    }
}

const assignGifs = async (lyrics) => {
    const punctuation = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
    lyrics.forEach(word => {
        if (typeof word === "object") {
            word.imgSrc = searchGif(word.value.replace(punctuation, ""))
        }})
    return lyrics
}

/************ HTML RENDER METHODS ************/ 
const renderTrackInfo = (track_obj) =>{
    document.querySelector(".track-info").innerHTML = `
        <div class="info-container">
            <h1 class="track-name">${track_obj.track}</h1>
            <p class="artist-name">${track_obj.artist}</p>
        </div>
    `
}

// Function to switch views to lyrics mode
const lyricsView = async (list_of_words) => {
    document.querySelector(".view-switch").style.background = "lightgrey";
    document.querySelector(".view-switch").style.color = "black";
    document.querySelector(".circle").style.transform = "translateX(0px)";

    let gif_lyrics = "";

    // For each word in the lyrics array, if the word is a key word and there is a gif associated with it, render it onto the page
    for (i = 0; i < list_of_words.length; i++) {
        if (typeof list_of_words[i] === "object" && await list_of_words[i].imgSrc != "") {
            // If the html value incldues a break, split the string, putting the key word in the <span>, and the rest outside of the <span>
            if (list_of_words[i].htmlVal.includes("<br>")) {
                let splitString = list_of_words[i].htmlVal.split(/(?=<br>)/g)
                gif_lyrics += `<span class="keyword"><p>${splitString[0]}&nbsp</p><img src="${await list_of_words[i].imgSrc}"></span>
                ${splitString.slice(1).join("")}&nbsp`
            }
            else {
                gif_lyrics += `<span class="keyword"><p>${list_of_words[i].htmlVal}&nbsp</p><img src="${await list_of_words[i].imgSrc}"></span>`
            }    
        }
        else if (typeof list_of_words[i] === "object" && await list_of_words[i].imgSrc === "") {
            gif_lyrics +=  `${list_of_words[i].htmlVal}&nbsp`
        }
        else {
            gif_lyrics += `${list_of_words[i]}&nbsp`
        }
    }

    const html_lyrics = 
    `<div class="lyrics-text">
        ${gif_lyrics}
    </div>`

    return html_lyrics
}

// Function to correct images out of viewport
const handleOverflow = (className) => {
    const windowWidth = window.innerWidth;
    const elements = document.querySelectorAll(className);
    elements.forEach(el => {
        let parent = el.closest("span");
        parent.addEventListener("mouseover", event => {
            hideBanner()
            let rightDistance = 0;
            let position = el.getBoundingClientRect();
            if (position.left <= 0) {
                el.style.left = `${el.style.left.split("px")[0] - el.style.left}px`
            }
            rightDistance = windowWidth - position.left - el.width - 2 * el.style.borderWidth.split("px")[0];
            if (rightDistance < 0) {
                el.style.left = `${(el.style.left.split("px")[0] - (-rightDistance))}px`
            }
        })     
    })
}

// Function to switch views to grid mode
const gridView = async (list_of_words) => {
    document.querySelector(".view-switch").style.background = "blue";
    document.querySelector(".view-switch").style.color = "white";
    document.querySelector(".circle").style.transform = "translateX(50px)";
    hideBanner();
    let grid_of_gifs = "";

    // For each word in the lyrics array, if the word is a key word and there is a gif associated with it, render it onto the page, gif first
    for (i = 0; i < list_of_words.length; i++) {
        if (typeof list_of_words[i] === "object" && await list_of_words[i].imgSrc != "") {
            grid_of_gifs += 
            `<div class="key-gif">
                <img src=${await list_of_words[i].imgSrc}>
                <p>${list_of_words[i].value}</p>
            </div>`
        }
    }
    const grid = 
    `<div class="grid-view">
        ${grid_of_gifs}
    </div>`
    
    return grid
}

const handleViewSwitch = () => {
    document.querySelector(".view-switch").addEventListener("click", (e) => {
        renderView(GIF_LYRICS)
    })
}

const showBanner = (text) => {
    const banner = document.querySelector(".banner")
    banner.style.transform = "translateX(0px)"
    banner.style.opacity = "1";
    banner.innerHTML = text;
}

const hideBanner = () => {
    const banner = document.querySelector(".banner")
    banner.style.transform = "translateX(300px)"
    banner.style.opacity = "0";
}

// Renders dynamic elements into html 
const renderView = async (lyrics) => {
    if (setInitialState) {
        document.querySelector(".view-switch").style.display = "flex";
        render_container.innerHTML = await lyricsView(lyrics)
        assignTheme(COLOR_THEMES);
        await handleOverflow(".keyword img")
        setInitialState = false;
        hideConsole();
        showBanner(`
            <p class="banner-text">Hover or click <span class="banner-text--emphasis">key words</span> to show GIF!</p>
            <img src="https://static.thenounproject.com/png/74537-200.png">
        `);
        document.querySelectorAll(".keyword p").forEach(word => {
            word.style.animation = "blink 600ms 2 1.5s"
        });
    }
    else if (gridActive) {
        render_container.innerHTML = await lyricsView(lyrics)
        gridActive = false;
        assignTheme(CURRENT_THEME);
    }
    else {
        render_container.innerHTML = await gridView(lyrics)
        gridActive = true;
        assignTheme(CURRENT_THEME);
    }
}

// Function to change colors randomly upon search, based on pre-set themes
const assignTheme = async (themes) => {
    const body = document.querySelector("body") // primary
    const lyrics_text = document.querySelector(".lyrics-text") // text color
    const song_title = document.querySelector(".info-container h1") // secondary
    const song_artist = document.querySelector(".info-container p") // text color
    const keyword_text = document.querySelectorAll(".keyword") // secondary

    let theme = ""
    
    if (themes.length > 1) {
        let i = Math.floor(Math.random() * COLOR_THEMES.length)
        theme = (themes[i].name === CURRENT_THEME.name) ? themes[i+1] : themes[i];
    }
    else {
        theme = themes;
    }     
    if (!gridActive) {
        lyrics_text.style.color = theme.textColor;
        keyword_text.forEach(word => word.style.color = theme.secondary);
    }
    body.style.backgroundColor = theme.primary;
    song_title.style.color = theme.primary;
    song_title.style['-webkit-text-stroke-color'] = theme.secondary;
    song_artist.style.color = theme.textColor;
    
    /// console.log(`${theme.name} theme activated...`);
    CURRENT_THEME = theme;
}

// Function to show console on user interaction
const showConsole = () => { 

    const wrapper = document.querySelector(".console-wrapper");

    document.querySelector(".console").addEventListener("mouseover", () => {
        wrapper.style.transform = "translateX(0px)" 
        wrapper.style.transitionDelay = "0s" 
        wrapper.style.opacity = "1" 
    })
    document.querySelector(".hover-div").addEventListener("mouseover", () => {
        wrapper.style.transform = "translateX(0px)" 
        wrapper.style.transitionDelay = "0s" 
        wrapper.style.opacity = "1" 
    })
    document.querySelector(".search-inputs").addEventListener("mouseover", () => {
        wrapper.style.transform = "translateX(0px)" 
        wrapper.style.transitionDelay = "0s" 
        wrapper.style.opacity = "1" 
    })
}

// Function to hide console when idle 
const hideConsole = () => { 

    const wrapper = document.querySelector(".console-wrapper");
    
    if (!setInitialState && detectWindowLarge() && document.querySelector("input") != document.activeElement) {
        wrapper.style.transform = "translateX(-465px)" 
        wrapper.style.opacity = "0.33" 
   
        document.querySelector(".console").addEventListener("mouseout", () => {
        wrapper.style.transform = "translateX(-465px)" 
        wrapper.style.transitionDelay = "5s" 
        wrapper.style.opacity = "0.33" 
        })

        document.querySelector(".hover-div").addEventListener("mouseout", () => {
            wrapper.style.transform = "translateX(-465px)" 
            wrapper.style.transitionDelay = "5s" 
            wrapper.style.opacity = "0.33" 
        })
    }
}

// If window is smaller than 768px, don't hide console
const detectWindowLarge = () => {
    const mediaQuery = window.matchMedia( "(min-width: 768px)" );
    if (mediaQuery.matches) {
        showConsole();
        setTimeout(hideConsole, 5000)
        return true
    }
    return false
}

/************ FORM METHODS ************/ 
const handleFormSubmit = () => {
    document.querySelector("button[type='submit']")
      .addEventListener("click", (e) => {
        e.preventDefault();
        const track = document.querySelector("#track-search").value;
        const artist = document.querySelector("#artist-search").value;
        if (track === "" || artist === "") {
            return alert("Please type in a song and an artist name.")
        }
        handleTrack(track, artist)
        getSongTitleArtistName(track, artist)  
      })
  }

/************ MAIN APP ************/
const main = () => {
    handleFormSubmit();
    handleViewSwitch();
    detectWindowLarge()
}

document.addEventListener("DOMContentLoaded", function(){
    main();
});
