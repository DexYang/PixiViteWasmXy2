#include <memory>
#include "ujpeg.cpp"

uJPEG m_ujpeg = uJPEG();

bool decode_map_jpeg(uint8_t* in, uint32_t inSize, uint8_t* out, bool mapx) {
    if (!m_ujpeg.decode(in, inSize, mapx))
        return false;
    if (!m_ujpeg.isValid())
        return false;
    m_ujpeg.getImage(out);
	return true;
}

void byte_swap(uint16_t& value) {
	uint16_t tempvalue = value >> 8;
	value = (value << 8) | tempvalue;
}

void jpeg_repair(uint8_t* Buffer, uint32_t inSize, uint8_t* outBuffer, uint32_t* outSize) {
	// JPEG数据处理原理
	// 1、复制D8到D9的数据到缓冲区中
	// 2、删除第3、4个字节 FFA0
	// 3、修改FFDA的长度00 09 为 00 0C
	// 4、在FFDA数据的最后添加00 3F 00
	// 5、替换FFDA到FF D9之间的FF数据为FF 00

	uint32_t TempNum = 0; // 临时变量，表示已读取的长度
	uint16_t TempTimes = 0; // 临时变量，表示循环的次数
	uint32_t Temp = 0;
	bool break_while = false;

	// 当已读取数据的长度小于总长度时继续
	while (!break_while && TempNum < inSize && *Buffer++ == 0xFF) {
		*outBuffer++ = 0xFF;
		TempNum++;
		switch (*Buffer) {
		case 0xD8:
			*outBuffer++ = 0xD8;
			Buffer++;
			TempNum++;
			break;
		case 0xA0:
			Buffer++;
			outBuffer--;
			TempNum++;
			break;
		case 0xC0:
			*outBuffer++ = 0xC0;
			Buffer++;
			TempNum++;

			memcpy(&TempTimes, Buffer, sizeof(uint16_t)); // 读取长度
			byte_swap(TempTimes); // 将长度转换为Intel顺序

			for (int i = 0; i < TempTimes; i++) {
				*outBuffer++ = *Buffer++;
				TempNum++;
			}

			break;
		case 0xC4:
			*outBuffer++ = 0xC4;
			Buffer++;
			TempNum++;
			memcpy(&TempTimes, Buffer, sizeof(uint16_t)); // 读取长度
			byte_swap(TempTimes); // 将长度转换为Intel顺序

			for (int i = 0; i < TempTimes; i++) {
				*outBuffer++ = *Buffer++;
				TempNum++;
			}
			break;
		case 0xDB:
			*outBuffer++ = 0xDB;
			Buffer++;
			TempNum++;

			memcpy(&TempTimes, Buffer, sizeof(uint16_t)); // 读取长度
			byte_swap(TempTimes); // 将长度转换为Intel顺序

			for (int i = 0; i < TempTimes; i++) {
				*outBuffer++ = *Buffer++;
				TempNum++;
			}
			break;
		case 0xDA:
			*outBuffer++ = 0xDA;
			*outBuffer++ = 0x00;
			*outBuffer++ = 0x0C;
			Buffer++;
			TempNum++;

			memcpy(&TempTimes, Buffer, sizeof(uint16_t)); // 读取长度
			byte_swap(TempTimes); // 将长度转换为Intel顺序
			Buffer++;
			TempNum++;
			Buffer++;

			for (int i = 2; i < TempTimes; i++) {
				*outBuffer++ = *Buffer++;
				TempNum++;
			}
			*outBuffer++ = 0x00;
			*outBuffer++ = 0x3F;
			*outBuffer++ = 0x00;
			Temp += 1; // 这里应该是+3的，因为前面的0xFFA0没有-2，所以这里只+1。

			// 循环处理0xFFDA到0xFFD9之间所有的0xFF替换为0xFF00
			for (; TempNum < inSize - 2;) {
				if (*Buffer == 0xFF) {
					*outBuffer++ = 0xFF;
					*outBuffer++ = 0x00;
					Buffer++;
					TempNum++;
					Temp++;
				}
				else {
					*outBuffer++ = *Buffer++;
					TempNum++;
				}
			}
			// 直接在这里写上了0xFFD9结束Jpeg图片.
			Temp--; // 这里多了一个字节，所以减去。
			outBuffer--;
			*outBuffer-- = 0xD9;
			break;
		case 0xD9:
			// 算法问题，这里不会被执行，但结果一样。
			*outBuffer++ = 0xD9;
			TempNum++;
			break;
		case 0xE0:
			break_while = true; // 如果碰到E0,则说明后面的数据不需要修复
			while (TempNum < inSize) {
				*outBuffer++ = *Buffer++;
				TempNum++;
			}
			break;
		default:
			break;
		}
	}
	Temp += inSize;
	*outSize = Temp;
}
