import { Button } from "ui";
import { bar } from "lib/foo";

export default function Web() {
  console.log({ bar });
  return (
    <div>
      <h1>Web</h1>
      <Button />
    </div>
  );
}
