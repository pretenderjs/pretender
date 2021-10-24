import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import { readFileSync } from "fs";
import pkg from "./package.json";

const globals = {
  "fake-xml-http-request": "FakeXMLHttpRequest",
  "route-recognizer": "RouteRecognizer",
  "url-parse": "urlParse",
};

const rollupTemplate = readFileSync("./iife-wrapper.js").toString();
const [banner, footer] = rollupTemplate.split("/*==ROLLUP_CONTENT==*/");

module.exports = [
  {
    input: "src/index.ts",
    external: Object.keys(pkg.dependencies),
    output: [
      {
        name: "Pretender",
        file: pkg.main,
        format: "iife",
        globals,
        banner,
        footer,
      },
      {
        file: pkg.module,
        format: "es",
      },
    ],
    plugins: [commonjs(), resolve(), typescript({ useTsconfigDeclarationDir: true })],
  },
  {
    input: "src/index.ts",
    output: [
      {
        file: "./dist/pretender.bundle.js",
        name: "Pretender",
        format: "iife",
      }
    ],
    plugins: [commonjs(), resolve(), typescript({ useTsconfigDeclarationDir: true })],
  },
];
