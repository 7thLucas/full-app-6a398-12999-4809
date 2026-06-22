export default function IndexRoute() {
  return (
    <iframe
      src="https://hospital.siloam.qtn.ai/"
      title="Siloam Hospital"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
      }}
      allow="fullscreen; clipboard-read; clipboard-write; camera; microphone; geolocation"
    />
  );
}
