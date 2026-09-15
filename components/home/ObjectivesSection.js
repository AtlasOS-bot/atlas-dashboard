"use client";

import ObjectiveCard from "./ObjectiveCard";
import { getQuarterInfo, getMonthInfo, getWeekInfo, getDayInfo } from "../../lib/homeDates";

export default function ObjectivesSection() {
  const quarter = getQuarterInfo();
  const month = getMonthInfo();
  const week = getWeekInfo();
  const day = getDayInfo();

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
      <ObjectiveCard
        periodType="week"
        periodKey={week.key}
        label="WEEKLY OBJECTIVE"
        size="medium"
        showHeadline
        showChecklist
      />
      <ObjectiveCard
        periodType="day"
        periodKey={day.key}
        label="TODAY'S OBJECTIVE"
        size="medium"
        showHeadline={false}
        showChecklist
      />
    </>
  );
}
