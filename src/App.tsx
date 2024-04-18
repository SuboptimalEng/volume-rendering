import { ThreeSceneV1 } from './ThreeSceneV1';
import { ThreeSceneV2 } from './ThreeSceneV2';
import { ThreeSceneV3 } from './ThreeSceneV3';

function App() {
  const v1 = false;
  const version = 'v3';
  const map = {
    v1: <ThreeSceneV1 />,
    v2: <ThreeSceneV2 />,
    v3: <ThreeSceneV3 />,
  }[version];

  return (
    <>
      <div>{map}</div>
    </>
  );
}

export default App;
