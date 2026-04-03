import IspNode from './IspNode'
import ModemNode from './ModemNode'
import RouterNode from './RouterNode'
import AccessPointNode from './AccessPointNode'
import SwitchNode from './SwitchNode'
import WiredDeviceNode from './WiredDeviceNode'
import WirelessDeviceNode from './WirelessDeviceNode'

export const nodeTypes = {
  isp: IspNode,
  modem: ModemNode,
  router: RouterNode,
  accessPoint: AccessPointNode,
  switch: SwitchNode,
  wiredDevice: WiredDeviceNode,
  wirelessDevice: WirelessDeviceNode,
} as const
