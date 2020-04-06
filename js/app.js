const MUSIX_KEY = '06b4409f6ef339768789f20421155dad';
const GIPHY_KEY = "rgXdbqSnr24kKy3JgEjCAFctsgKCR4Zr"
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
        name: "gamecores",
        primary: "rgb(206, 130, 168)",
        secondary: "rgb(35, 180, 210)",
        textColor: "rgb(5, 15, 50)"
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
    {
        name: "deyoung",
        primary: "cmyk(96%, 0%, 100%, 42%)",
        secondary: "cmyk(8%, 61%, 78%, 0%)",
        textColor: "cmyk(40%, 30%, 30%, 100%)"
    },
    
    

]



let CURRENT_THEME = ""
let GIF_LYRICS = "";
let gridActive = false;
let setInitialState = true;

/* TRACK METHODS */ 
const getLyrics = async (songName, artist) => {

    try {
        songName.replace(/\s/g, '%20');
        (artist)? artist.replace(/\s/g, '%20') : null;
        let response = await fetch(`https://cors-anywhere.herokuapp.com/https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=${songName}&q_artist=${artist}&apikey=${MUSIX_KEY}`);
        //let response = await fetch(`https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=${songName}&q_artist=${artist}&apikey=${MUSIX_KEY}`);
        const search_data = await response.json();
        console.log(search_data)
        const lyrics_raw = await search_data.message.body.lyrics.lyrics_body;
        const lyrics_clean = lyrics_raw.substring(0, lyrics_raw.indexOf("*"));
        console.log(lyrics_clean)
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

const getSongTitleArtistName = async (songName, artist) => {
       /* Render artist, song and album on top */ 
       try {
            let response = await fetch(`https://cors-anywhere.herokuapp.com/https://api.musixmatch.com/ws/1.1/matcher.track.get?q_artist=${artist}&q_track=${songName}&apikey=${MUSIX_KEY}`)
            //let response = await fetch(`https://api.musixmatch.com/ws/1.1/matcher.track.get?q_artist=${artist}&q_track=${songName}&apikey=${MUSIX_KEY}`)

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
       }
}

const parseLyrics = (lyrics_data) => {
    //const punctuation = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
    let lyrics = nlp(lyrics_data);

    const keywords = [];

    const verbs = lyrics.verbs().json();
    const nouns = lyrics.nouns().json();
    const adjectives = lyrics.adjectives().json();
    const acronyms = lyrics.acronyms().json();
    const topics = lyrics.topics().json();
    const adverbs =  lyrics.adverbs().json();

    nouns.forEach(noun => { keywords.push(noun.text)})
    verbs.forEach(verb => { keywords.push(verb.text)})
    adjectives.forEach(adjective => {keywords.push(adjective.text)})
    adverbs.forEach(adverb => {keywords.push(adverb.text)})
    topics.forEach(topic => {keywords.push(topic.text)})

    // REFACTOR split all words, if words are either nouns, names, objects, places adverbs, make it into object below
    //parsedLyrics = lyrics_data
    console.log(lyrics_data)
    parsedLyrics = lyrics_data.replace(/(?:\r\n|\r|\n)/g, '<br>').split(/\s+/);

    for (i = 0; i < parsedLyrics.length ; i++) {
        if (keywords.includes(parsedLyrics[i])) {
            parsedLyrics[i] = 
            {
                value: parsedLyrics[i],
                imgSrc: "",
                alt: ""
            }
        }
    }
    console.log(keywords);
    console.log(parsedLyrics);
    return parsedLyrics.filter(w => w != '');
}

const handleTrack = async (song, artist) => {
    setInitialState = true;
    //gridActive = false;
    render_container.innerHTML = ""; 
    const track = await getLyrics(song, artist);
    const parsed_track = parseLyrics(track);
    GIF_LYRICS = await assignGifs(parsed_track);
    //console.log(lyrics_with_gifs)
    renderView(GIF_LYRICS);
    
}


/* IMG ASSIGNMENT METHODS */
const searchGif = async (searchTerm) => {
    const selection = Math.floor(Math.random() * 5);

    try {
        let response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${searchTerm}&offset=${selection}`); // Regular Search
        //let response = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_KEY}&tag=${searchTerm}`); // Random Search
        const giphy_data = await response.json();
        const gif_url = giphy_data.data[0].images.original.url // Regular Search Query
        //const gif_url = giphy_data.data.images.original.url; // Random Query
        return gif_url
    }   

    catch(err){
        console.error(err);
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

/* HTML RENDER METHODS */ 
const renderTrackInfo = (track_obj) =>{
    document.querySelector(".track-info").innerHTML = `
        <div class="info-container">
            <h1 class="track-name">${track_obj.track}</h1>
            <p class="artist-name">${track_obj.artist}</p>
        </div>
    `
}

const lyricsView = async (list_of_words) => {
    document.querySelector(".view-switch").style.background = "lightgrey";
    document.querySelector(".view-switch").style.color = "black";
    document.querySelector(".circle").style.transform = "translateX(0px)";

    let gif_lyrics = "";

    for (i = 0; i < list_of_words.length; i++) {
        gif_lyrics += (typeof list_of_words[i] === "object")? 
        (`<span class="keyword"><p>${list_of_words[i].value}&nbsp</p><img src="${await list_of_words[i].imgSrc}"></span>`) 
        : (`${list_of_words[i]} `)
    }

    const html_lyrics = 

    `<div class="lyrics-text">
        ${gif_lyrics}
    </div>`

    return html_lyrics
}

const gridView = async (list_of_words) => {
    document.querySelector(".view-switch").style.background = "blue";
    document.querySelector(".view-switch").style.color = "white";
    document.querySelector(".circle").style.transform = "translateX(50px)";
    let grid_of_gifs = "";
    for (i = 0; i < list_of_words.length; i++) {
        if (typeof list_of_words[i] === "object") {
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

const renderView = async (lyrics) => {
    if (setInitialState) {
        document.querySelector(".view-switch").style.display = "flex";
        render_container.innerHTML = await lyricsView(lyrics)
        assignTheme(COLOR_THEMES);
        setInitialState = false;
    }

    else if (gridActive) {
        render_container.innerHTML = await lyricsView(lyrics)
        assignTheme(CURRENT_THEME);
        gridActive = false
    }

    else {
        render_container.innerHTML = await gridView(lyrics)
        assignTheme(CURRENT_THEME);
        gridActive = true;
    }
}

const assignTheme = async (themes) => {
    const main = document.querySelector("main") // primary
    const lyrics_text = document.querySelector(".lyrics-text") // black or white
    const song_title = document.querySelector(".info-container h1") // secondary
    const song_artist = document.querySelector(".info-container p") // black or white
    const keyword_text = document.querySelectorAll(".keyword") // secondary
    const gif_img = document.querySelectorAll(".keyword img")
    // footer


    let theme = ""
    
    if (themes.length > 1) {
        let i = Math.floor(Math.random() * COLOR_THEMES.length)
        theme = themes[i];
    }

    else {
        theme = themes;
    }     
    main.style.backgroundColor = theme.primary;
    song_title.style.color = theme.primary;
    song_title.style['-webkit-text-stroke-color'] = theme.secondary;
    song_artist.style.color = theme.textColor;
    lyrics_text.style.color = theme.textColor;
    keyword_text.forEach(word => word.style.color = theme.secondary);
    // img
    // footer
    CURRENT_THEME = theme;
}

const showConsole = () => { 
    document.querySelector(".console").addEventListener("mouseover", () => {
        document.querySelector(".console").style.transform = "translateX(0px)" 
        document.querySelector(".console").style.opacity = "1" 
    })
    document.querySelector(".hover-div").addEventListener("mouseover", () => {
        document.querySelector(".console").style.transform = "translateX(0px)" 
        document.querySelector(".console").style.opacity = "1" 
    })
    document.querySelector(".search-box").addEventListener("mouseover", () => {
        document.querySelector(".console").style.transform = "translateX(0px)" 
        document.querySelector(".console").style.opacity = "1" 
    })
}



const hideConsole = () => { 
    document.querySelector(".console").style.transform = "translateX(-420px)" 
    document.querySelector(".console").style.opacity = "0" 

    document.querySelector(".console").addEventListener("mouseout", () => {
        setTimeout(hideConsole, 8000)
    })

    document.querySelector(".hover-div").addEventListener("mouseout", () => {
        setTimeout(hideConsole, 8000)
    })
}


/* FORM METHODS */ 
const handleFormSubmit = () => {
    document.querySelector("button[type='submit']")
      .addEventListener("click", (e) => {
        e.preventDefault();
        const track = document.querySelector("#track-search").value;
        const artist = document.querySelector("#artist-search").value;
        handleTrack(track, artist)
        getSongTitleArtistName(track, artist)  
      })
  }


/* MAIN APP */
const main = () => {
    handleFormSubmit();
    handleViewSwitch();
    showConsole();
    setTimeout(hideConsole, 9200)
}

main();

// Make naming clearer
// Have a wrapper
// Group related functions together and comment it
// Lint/indexing

