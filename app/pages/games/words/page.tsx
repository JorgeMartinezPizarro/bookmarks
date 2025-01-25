'use client';

const Wording = () => {
  fetch("https://nube.ideniox.com/word").then(a => a.json()).then(a => console.log(JSON.stringify(a)))
  return <></>
}

export default Wording;