"use client";

import ObjectiveCard from "./ObjectiveCard";
import { getQuarterInfo, getMonthInfo } from "../../lib/homeDates";

export default function ObjectivesSection() {
  const quarter = getQuarterInfo();
  const month = getMonthInfo();

  return (
    <>
      <ObjectiveCard
        periodType="quarter"
        periodKey={quarter.key}
        label={`${quarter.quarterLabel} OBJECTIVE`}
        size="large"
        showHeadline
        showChecklist={false}
      />
      <ObjectiveCard
        periodType="month"
        periodKey={month.key}
        label="MONTHLY OBJECTIVE"
        size="medium"
        showHeadline
        showChecklist
      />
    </>
  );
}
