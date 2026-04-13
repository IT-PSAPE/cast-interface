import { readFile, writeFile } from 'node:fs/promises';
import { crc32 } from 'node:zlib';
import type { DeckBundleManifest } from '@core/types';

const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const MANIFEST_ENTRY_NAME = 'manifest.json';

export async function writeDeckBundleArchive(filePath: string, manifest: DeckBundleManifest): Promise<void> {
  const entryName = Buffer.from(MANIFEST_ENTRY_NAME, 'utf8');
  const data = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(LOCAL_FILE_HEADER_SIGNATURE, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(0, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(crc32(data), 14);
  localHeader.writeUInt32LE(data.length, 18);
  localHeader.writeUInt32LE(data.length, 22);
  localHeader.writeUInt16LE(entryName.length, 26);
  localHeader.writeUInt16LE(0, 28);

  const localSection = Buffer.concat([localHeader, entryName, data]);
  const centralDirectory = Buffer.alloc(46);
  centralDirectory.writeUInt32LE(CENTRAL_DIRECTORY_SIGNATURE, 0);
  centralDirectory.writeUInt16LE(20, 4);
  centralDirectory.writeUInt16LE(20, 6);
  centralDirectory.writeUInt16LE(0, 8);
  centralDirectory.writeUInt16LE(0, 10);
  centralDirectory.writeUInt16LE(0, 12);
  centralDirectory.writeUInt16LE(0, 14);
  centralDirectory.writeUInt32LE(crc32(data), 16);
  centralDirectory.writeUInt32LE(data.length, 20);
  centralDirectory.writeUInt32LE(data.length, 24);
  centralDirectory.writeUInt16LE(entryName.length, 28);
  centralDirectory.writeUInt16LE(0, 30);
  centralDirectory.writeUInt16LE(0, 32);
  centralDirectory.writeUInt16LE(0, 34);
  centralDirectory.writeUInt16LE(0, 36);
  centralDirectory.writeUInt32LE(0, 38);
  centralDirectory.writeUInt32LE(0, 42);

  const centralSection = Buffer.concat([centralDirectory, entryName]);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(1, 8);
  endOfCentralDirectory.writeUInt16LE(1, 10);
  endOfCentralDirectory.writeUInt32LE(centralSection.length, 12);
  endOfCentralDirectory.writeUInt32LE(localSection.length, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  await writeFile(filePath, Buffer.concat([localSection, centralSection, endOfCentralDirectory]));
}

export async function readDeckBundleArchive(filePath: string): Promise<DeckBundleManifest> {
  const archive = await readFile(filePath);
  const endOffset = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (endOffset < 0) {
    throw new Error('Invalid bundle archive.');
  }

  const centralDirectoryOffset = archive.readUInt32LE(endOffset + 16);
  if (archive.readUInt32LE(centralDirectoryOffset) !== CENTRAL_DIRECTORY_SIGNATURE) {
    throw new Error('Invalid bundle archive.');
  }

  const entryNameLength = archive.readUInt16LE(centralDirectoryOffset + 28);
  const localHeaderOffset = archive.readUInt32LE(centralDirectoryOffset + 42);
  if (archive.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error('Invalid bundle archive.');
  }

  const centralEntryName = archive.subarray(centralDirectoryOffset + 46, centralDirectoryOffset + 46 + entryNameLength).toString('utf8');
  if (centralEntryName !== MANIFEST_ENTRY_NAME) {
    throw new Error('Invalid bundle entry.');
  }

  const compressionMethod = archive.readUInt16LE(localHeaderOffset + 8);
  if (compressionMethod !== 0) {
    throw new Error('Unsupported bundle compression.');
  }

  const localNameLength = archive.readUInt16LE(localHeaderOffset + 26);
  const extraFieldLength = archive.readUInt16LE(localHeaderOffset + 28);
  const dataLength = archive.readUInt32LE(localHeaderOffset + 22);
  const dataOffset = localHeaderOffset + 30 + localNameLength + extraFieldLength;
  const data = archive.subarray(dataOffset, dataOffset + dataLength);

  try {
    return JSON.parse(data.toString('utf8')) as DeckBundleManifest;
  } catch (error) {
    throw new Error(`Invalid bundle manifest: ${(error as Error).message}`);
  }
}
