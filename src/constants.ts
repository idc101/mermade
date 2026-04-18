import { MarkerType } from 'reactflow';
import type { NodeTypes, EdgeTypes } from 'reactflow';
import CustomNode from './components/CustomNode';
import SubgraphNode from './components/SubgraphNode';
import FloatingEdge from './components/FloatingEdge';

export const STORAGE_KEY = 'arrows-diagram-text';
export const CONFIG_DELIMITER = '%% --- arrows-config --- %%';

export const nodeTypes: NodeTypes = {
  customNode: CustomNode,
  subgraphNode: SubgraphNode,
};

export const edgeTypes: EdgeTypes = {
  floating: FloatingEdge,
};

export const defaultEdgeOptions = {
  type: 'floating',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#000',
  },
};

export const initialText = `graph TD
    subgraph Battery_Power ["Power Source"]
        LIPO[2S LiPo Battery 7.4V]
    end

    subgraph Regulation ["Voltage Management"]
        BUCK[Buck Converter 7.4V to 5V]
    end

    subgraph Logic ["Control Unit"]
        ESP32[ESP32 Development Board]
    end

    subgraph Actuators ["Motors and Steering"]
        DRIVER[Motor Driver - e.g. MX1508]
        SERVO[9g Servo]
        MOT1[N20 Motor Left]
        MOT2[N20 Motor Right]
    end
    LIPO -- VCC --> BUCK
    LIPO -- VCC --> DRIVER
    LIPO -- GND --> DRIVER
    LIPO -- GND --> BUCK
    
    BUCK -- 5V --> ESP32_VIN[ESP32 VIN Pin]
    BUCK -- 5V --> SERVO_VCC[Servo Red Wire]
    ESP32_GND[ESP32 GND] -- Common Ground --> DRIVER_GND[Driver GND]
    SERVO_GND[Servo Brown Wire] -- GND --> ESP32_GND
    ESP32 -- PWM Signal --> SERVO_SIG[Servo Orange Wire]
    ESP32 -- GPIO Pins --> DRIVER
    DRIVER -- A --> MOT1
    DRIVER -- B --> MOT2`;
