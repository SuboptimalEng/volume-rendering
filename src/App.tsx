import { ThreeSceneV1 } from './ThreeSceneV1';
import { ThreeSceneV2 } from './ThreeSceneV2';

function App() {
  const v1 = false;

  return (
    <>
      {v1 ? <ThreeSceneV1 /> : <ThreeSceneV2 />}
      {/*  */}
    </>
  );
}

export default App;
