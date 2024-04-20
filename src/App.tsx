import { ThreeSceneV1 } from './ThreeSceneV1';
import { ThreeSceneV2 } from './ThreeSceneV2';

function App() {
  const version = 'v1';
  const map = {
    v1: <ThreeSceneV1 />,
    v2: <ThreeSceneV2 />,
  }[version];

  return (
    <>
      <div>{map}</div>
    </>
  );
}

export default App;
