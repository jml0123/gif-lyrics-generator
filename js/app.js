// User inputs text into box
// Split the input
// API: Parse text using Compromise

// Each key word is assigned a gif attribute
// API: Pass the collection of key words to Giphy Search
// Assign gif src values to key words

/* TEXT VIEW */
// If word is a key word (object), then append a <span> with <img> (the gif source)
// Render text to screen


const MUSIX_KEY = '06b4409f6ef339768789f20421155dad';
const GIPHY_KEY = "rgXdbqSnr24kKy3JgEjCAFctsgKCR4Zr"
const render_container = document.querySelector(".render-container");
// CORS http://cors-anywhere.herokuapp.com/
let GIF_LYRICS = "";
let gridActive = false;
let setInitialState = true;

const searchTrack = async (songName, artist) => {

    try {
        songName.replace(/\s/g, '%20');
        (artist)? artist.replace(/\s/g, '%20') : null;
        let response = await fetch(`http://cors-anywhere.herokuapp.com/https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=${songName}&q_artist=${artist}&apikey=${MUSIX_KEY}`);
        const search_data = await response.json();
        //console.log(search_data)
        
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


const parseLyrics = (lyrics_data) => {
    const punctuation = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
 
    let lyrics = nlp(lyrics_data);

    const keywords = [];
    const stopwords = [];

    const verbs = lyrics.verbs().json();
    const nouns = lyrics.nouns().json();
    const adjectives = lyrics.adjectives().json();
    const acronyms = lyrics.acronyms().json();
    const topics = lyrics.topics().json();
    const adverbs =  lyrics.adverbs().json();

    nouns.forEach(noun => { keywords.push(noun.text)})
    verbs.forEach(verb => { keywords.push(verb.text)})
    adjectives.forEach(adjective => {keywords.push(adjective.text)})
    //adverbs.forEach(adverb => {keywords.push(adverb.text)})
    topics.forEach(topic => {keywords.push(topic.text)})



    // REFACTOR split all words, if words are either nouns, names, objects, places adverbs, make it into object below
    parsedLyrics = lyrics_data.split(/\s+/);

    // if keyword is in banned words, then remove it from keywords


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

    return parsedLyrics.filter(w => w != '');
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

const searchGif = async (searchTerm) => {

    const selection = Math.floor(Math.random() * 5)

    try {

        // Regular Search
        let response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${searchTerm}&offset=${selection}`);
        // Random Search
        //let response = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_KEY}&tag=${searchTerm}`);
        
        const giphy_data = await response.json();

        // Regular Search Query
        const gif_url = giphy_data.data[0].images.original.url
        // Random Query
        //const gif_url = giphy_data.data.images.original.url;
    
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
    //console.log(lyrics)
    return lyrics
}

const handleTrack = async (song, artist) => {
    setInitialState = true;
    //gridActive = false;
    render_container.innerHTML = ""; 
    const track = await searchTrack(song, artist);
    const parsed_track = parseLyrics(track);
    GIF_LYRICS = await assignGifs(parsed_track);
    
    //console.log(lyrics_with_gifs)
    renderView(GIF_LYRICS);
}

    
document.querySelector(".view-switch")
.addEventListener("click", (e) => {
    renderView(GIF_LYRICS)
})


const renderView = async (lyrics) => {
    if (setInitialState) {
        document.querySelector(".view-switch").style.display = "flex";
        render_container.innerHTML = await lyricsView(lyrics)
        setInitialState = false;
    }

    else if (gridActive) {
        render_container.innerHTML = await lyricsView(lyrics)
        gridActive = false
    }

    else {
        render_container.innerHTML = await gridView(lyrics)
        gridActive = true;
    }
}

const handleFormSubmit = () => {
    document.querySelector("button[type='submit']")
      .addEventListener("click", (e) => {
        e.preventDefault();
        const track = document.querySelector("#track-search").value;
        const artist = document.querySelector("#artist-search").value;
        handleTrack(track, artist)
      })
  }

handleFormSubmit();

