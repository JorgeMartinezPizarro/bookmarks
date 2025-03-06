'use client'
import useAudioRecorder from "../../hooks/useAudioRecorder";

export default () => {
    const { isRecording, audioURL, startRecording, stopRecording } = useAudioRecorder();

    return <>
    <div>
      <h2>Audio Recorder</h2>
      {isRecording ? (
        <button onClick={stopRecording}>Stop Recording</button>
      ) : (
        <button onClick={startRecording}>Start Recording</button>
      )}
      {audioURL && (
        <div>
          <audio controls src={audioURL}></audio>
          <a href={audioURL} download="audio.webm">Download</a>
        </div>
      )}
    </div>
    </>
}