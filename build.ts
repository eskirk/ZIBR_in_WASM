import * as gulp from "gulp";
import { Service, project } from "@wasm/studio-utils";
import { FileType } from "@wasm/studio-utils/dist/model";

gulp.task("build", async () => {
  const data = await Service.assembleWat(project.getFile("src/main.wat").getData() as string);
  const outWasm = project.newFile("out/main.wasm", "wasm" as FileType, true);
  outWasm.setData(data);
});

gulp.task("default", ["build"], async () => {});
