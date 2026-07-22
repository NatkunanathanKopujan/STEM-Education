export const chartColors = ['#0EA5A0', '#2563EB', '#16A34A', '#7C3AED', '#DC2626', '#0891B2', '#BE123C'];

export const chartFills = ['#CCFBF1', '#DBEAFE', '#DCFCE7', '#EDE9FE', '#FEE2E2', '#CFFAFE', '#FFE4E6'];

export const countAxisDomain = [0, (dataMax) => Math.max(4, Math.ceil(Number(dataMax || 0)) + 1)];

export const percentAxisDomain = [0, 100];

export function getChartColor(index = 0) {
  return chartColors[index % chartColors.length];
}

export function getChartFill(index = 0) {
  return chartFills[index % chartFills.length];
}
