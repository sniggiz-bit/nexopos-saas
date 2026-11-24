import { useSyncExternalStore } from 'react';
import { serialPrinter } from '@/utils/serialPrinter';
export function useWebSerialPrinter() {
    const state = useSyncExternalStore(serialPrinter.subscribe, serialPrinter.getSnapshot, serialPrinter.getSnapshot);
    return { ...state, connect: serialPrinter.connect, disconnect: serialPrinter.disconnect, printBytes: serialPrinter.printBytes, isConnected: state.status === 'connected' };
}
