import type { SensorReading } from '@/contexts/SensorDataContext';

export type HealthAlert = {
  code: string;
  metric: 'temperature' | 'humidity';
  title: string;
  message: string;
};

const TEMPERATURE_LIMITS = {
  low: 18,
  high: 30,
};

const HUMIDITY_LIMITS = {
  low: 30,
  high: 70,
};

export const getHealthAlerts = (reading: SensorReading): HealthAlert[] => {
  const alerts: HealthAlert[] = [];

  if (reading.temperature < TEMPERATURE_LIMITS.low) {
    alerts.push({
      code: 'temperature-low',
      metric: 'temperature',
      title: 'انخفاض في درجة الحرارة',
      message: 'الجو أبرد من الحد الآمن وقد يزيد الانزعاج أو الحساسية التنفسية.',
    });
  } else if (reading.temperature > TEMPERATURE_LIMITS.high) {
    alerts.push({
      code: 'temperature-high',
      metric: 'temperature',
      title: 'ارتفاع في درجة الحرارة',
      message: 'الجو أكثر حرارة من الطبيعي وقد يسبب إجهادًا أو ضيقًا في التنفس.',
    });
  }

  if (reading.humidity < HUMIDITY_LIMITS.low) {
    alerts.push({
      code: 'humidity-low',
      metric: 'humidity',
      title: 'انخفاض في الرطوبة',
      message: 'الهواء الجاف قد يهيّج الصدر والأنف ويزيد الجفاف.',
    });
  } else if (reading.humidity > HUMIDITY_LIMITS.high) {
    alerts.push({
      code: 'humidity-high',
      metric: 'humidity',
      title: 'ارتفاع في الرطوبة',
      message: 'الرطوبة العالية قد تجعل التنفس أثقل وتزيد الشعور بالإرهاق.',
    });
  }

  return alerts;
};

export const buildHealthAlertBody = (alerts: HealthAlert[]) => alerts.map((alert) => alert.message).join(' ');
