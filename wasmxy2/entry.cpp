#include <stdio.h>
#include <stdbool.h>
#include <emscripten/emscripten.h>
#include "mapx.cpp"

// compile emcc -O2 entry.cpp -s TOTAL_MEMORY=1024MB -s EXPORTED_FUNCTIONS='["_read_map_x", "_read_map_1", "_malloc", "_free"]' -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -o ./build/wasmxy2.js 


#ifdef __cplusplus
extern "C" {
#endif
bool EMSCRIPTEN_KEEPALIVE read_map_x(uint8_t* in, uint32_t inSize, uint8_t* out) {
    return decode_map_jpeg(in, inSize, out, true);
}

bool EMSCRIPTEN_KEEPALIVE read_map_1(uint8_t* in, uint32_t inSize, uint8_t* out) {
    uint32_t repairedSize = 0;
    jpeg_repair(in, inSize, out, &repairedSize);
    return decode_map_jpeg(out, repairedSize, out, false);
}
#ifdef __cplusplus
}
#endif