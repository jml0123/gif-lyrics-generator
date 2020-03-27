

// User inputs text into box
// Split the input
// API: Parse text using Compromise

// Each key word is assigned a gif attribute
// API: Pass the collection of key words to Giphy Search
// Assign gif src values to key words

/* TEXT VIEW */
// If word is a key word (object), then append a <span> with <img> (the gif source)
// Render text to screen

/* VOICE VIEW */
// Render all key words gifs onto the screen

const MUSIX_KEY = '06b4409f6ef339768789f20421155dad';
const GIPHY_KEY = "rgXdbqSnr24kKy3JgEjCAFctsgKCR4Zr"
const searchTrack = async (songName, artist) => {

    try {
        songName.replace(/\s/g, '%20');
        (artist)? artist.replace(/\s/g, '%20') : null;
        let response = await fetch(`https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=${songName}&q_artist=${artist}&apikey=${MUSIX_KEY}`);
        const search_data = await response.json();
        //console.log(search_data)
        
        const lyrics_raw = await search_data.message.body.lyrics.lyrics_body;
        const lyrics_clean = lyrics_raw.substring(0, lyrics_raw.indexOf("*"));
        console.log(lyrics_clean)
        return lyrics_clean;
    }   
    catch(err){
        console.error(err);
        //
    }
}


// API: Parse text using Compromise
// for each word, if its a key word, make it an object
// 
const parseLyrics = (lyrics_data) => {
    const punctuation = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
    //const lyrics_rm_punc = lyrics_data.replace(punctuation, '')
 
    let lyrics = nlp(lyrics_data);

    //console.log(lyrics.verbs().json());
    //console.log(lyrics.nouns().json());
    const keywords = [];
    const stopwords = [];

    const verbs = lyrics.verbs().json();
    const nouns = lyrics.nouns().json();
    const adjectives = lyrics.adjectives().json();
    const acronyms = lyrics.acronyms().json();
    const topics = lyrics.topics().json();
    const adverbs =  lyrics.adverbs().json();

    /*places.forEach(place => {
        keywords.push(place.text)
    })*/

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
                imgSrc: "https://is5-ssl.mzstatic.com/image/thumb/Purple114/v4/17/38/87/1738875b-1008-0cf4-e3be-19ccf778fc2b/source/256x256bb.jpg",
                alt: ""
            }
        }
    }
    console.log(keywords);
    //console.log(parsedLyrics);

    return parsedLyrics.filter(w => w != '');
}



const createHTMLTemplate = async (list_of_words) => {
    
    
    let gif_lyrics = "";
    console.log(list_of_words.length)
    // Fix glitch with mis-positined span
    for (i = 0; i < list_of_words.length; i++) {
        gif_lyrics += (typeof list_of_words[i] === "object")? 
        (`<span class="keyword"><p>${list_of_words[i].value}&nbsp</p><img src="${await list_of_words[i].imgSrc}"></span>`) 
        : (`${list_of_words[i]} `)
    }

    //console.log(gif_lyrics)
    const html_lyrics = 
    `<div class="lyrics-text">
        ${gif_lyrics}</div>`

    console.log(html_lyrics)
    return html_lyrics
}

const searchGif = async (searchTerm) => {
    // api.giphy.com/v1/gifs/search
    const selection = Math.floor(Math.random() * 5)

    try {
        let response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${searchTerm}&offset=${selection}`);
        const giphy_data = await response.json();
        //console.log(giphy_data.data[0].images.downsized.url)
        const gif_url = giphy_data.data[0].images.original.url
        //const gif_url = giphy_data.data.images.original.url;
        console.log(gif_url)
        return gif_url
    }   

    catch(err){
        console.error(err);
        return ""
        //
    }
}


const assignGifs = async (lyrics) => {
    const punctuation = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
    lyrics.forEach(word => {
        if (typeof word === "object") {
            word.imgSrc = searchGif(word.value.replace(punctuation, ""))
     
        }})
    console.log(lyrics)
    return lyrics
}

const handleTrack = async () => {
    const track = await searchTrack("Exhibit C", "Jay Electronica");
    const parsed_track = parseLyrics(track);
    const lyrics_with_gifs = await assignGifs(parsed_track);
    //console.log(lyrics_with_gifs)
    const html_lyrics_template = await createHTMLTemplate(lyrics_with_gifs);
    document.querySelector(".render-container").innerHTML = html_lyrics_template;
}


handleTrack();

///fetch("https://api.genius.com/search?access_token=qdjxDKGZjuWCCNtaaDF9rp-t-gx-e3bj-TQW6TqAVBCgalS1LvVUO3SSrJ8xZ1Fb&q=", {"credentials":"omit","headers":{"accept":"application/json, text/plain, */*","accept-language":"en-US,en;q=0.9","if-none-match":"W/\"96bee9a520ea856be1072e78684ee305\"","sec-fetch-mode":"cors","sec-fetch-site":"same-site"},"referrer":"https://docs.genius.com/","referrer
//fetch("https://api.genius.com/search?access_token=qdjxDKGZjuWCCNtaaDF9rp-t-gx-e3bj-TQW6TqAVBCgalS1LvVUO3SSrJ8xZ1Fb&q=The+box", {"credentials":"omit","headers":{"accept":"application/json, text/plain, */*","accept-language":"en-US,en;q=0.9","sec-fetch-mode":"cors","sec-fetch-site":"same-site"},"referrer":"https://docs.genius.com/","referrerPolicy":"no-referrer-when-downgrade","body":null,"method":"GET","mode":"cors"});
// fetch("https://api.genius.com/search?access_token=qdjxDKGZjuWCCNtaaDF9rp-t-gx-e3bj-TQW6TqAVBCgalS1LvVUO3SSrJ8xZ1Fb&q=Humble", {"credentials":"omit","headers":{"accept":"application/json, text/plain, */*","accept-language":"en-US,en;q=0.9","if-none-match":"W/\"96bee9a520ea856be1072e78684ee305\"","sec-fetch-mode":"cors","sec-fetch-site":"same-site"},"referrer":"https://docs.genius.com/","referrerPolicy":"no-referrer-when-downgrade","body":null,"method":"GET","mode":"cors"});