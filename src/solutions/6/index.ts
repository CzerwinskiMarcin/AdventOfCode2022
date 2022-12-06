import {stringToArray} from "../../utils";

export default function (input: string): { first: any, second: any } {
    const buffers = stringToArray(input);
    buffers.forEach(buffer => {
        // console.log('Buffer', buffer);
        // console.log('Marker end position:', findFirstMarkerPosition(buffer, 14));
    })

	return {first: findFirstMarkerPosition(buffers[0], 4, false), second: findFirstMarkerPosition(buffers[0], 14, false)};
}

const findFirstMarkerPosition = (input: string, markerLength: number, debug: boolean = false): number => {
    const markerSeq = [];
    const separatedBuffer= input.split('');

    if (debug) {
        console.log('Input buffer:');
        console.log(input);
    }

    for (let i = 0; i < separatedBuffer.length; i++) {
        if (debug) {
            console.log('Index: ', i);
            console.log('Current marker seq', markerSeq);
            console.log('New sign:', separatedBuffer[i]);
        }
        if (markerSeq.includes(separatedBuffer[i])) {
            markerSeq.push(separatedBuffer[i]);
            const repeatedSignIndex = markerSeq.findIndex(sign => sign === separatedBuffer[i]);
            if (debug) {
                console.log('Sign already existing');
                console.log('index of repeated:', repeatedSignIndex);
            }
            if (repeatedSignIndex) i = i - repeatedSignIndex - 1;
            markerSeq.splice(0, repeatedSignIndex + 1);
            if (debug) {
                console.log('Returning index to:', i)
                console.log('Adjusting markerSeq', markerSeq);
                console.log('=======================\n')
            }
            continue;
        } else {
            markerSeq.push(separatedBuffer[i]);
            if (debug) {
                console.log('Unique sing found');
                console.log('Current marker seq', markerSeq);
            }
        }

        if (debug) {
            console.log('=======================\n')
        }

        if (markerSeq.length === markerLength) {
            if (debug) {
                console.log('Mark seq meets requirements', markerSeq);
            }
            return i + 1;
        }
    }
    return -1;
}