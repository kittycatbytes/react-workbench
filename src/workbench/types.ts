import type { ComponentType, ReactNode } from "react";

export type Repair = {
  code: string;
  focus: number[];
  tryThis: string;
  explanation: ReactNode;
};

export type Scenario = {
  id: string;
  label: string;
  tease: string;
  tryThis: string;
  code: string;
  focus: number[];
  explanation: ReactNode;
  repair?: Repair;
};

export type DemoProps = {
  scenarioId: string;
  repaired: boolean;
};

export type Lesson = {
  id: string;
  kicker: string;
  title: string;
  blurb: string;
  Demo: ComponentType<DemoProps>;
  scenarios: Scenario[];
};

export type PanelKey = "code" | "explain" | "whatif";
