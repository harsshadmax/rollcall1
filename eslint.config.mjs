import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const asArray = (c) => (Array.isArray(c) ? c : [c]);

const eslintConfig = [
  ...asArray(coreWebVitals),
  ...asArray(typescript),
  { ignores: [".next/**", "node_modules/**", "design/**", "out/**"] },
];

export default eslintConfig;
