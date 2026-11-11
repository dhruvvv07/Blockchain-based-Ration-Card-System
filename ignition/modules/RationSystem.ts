import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RationSystemModule = buildModule("RationSystemModule", (m) => {
  const rationSystem = m.contract("RationSystem");
  return { rationSystem };
});

export default RationSystemModule;