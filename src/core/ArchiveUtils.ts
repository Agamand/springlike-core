import Path from 'path';
import AdmZip from 'adm-zip';
export class ArchiveUtils {
  public static getExt(path: string): string {
    let pathParts = path.split('.');
    return pathParts[pathParts.length - 1];
  }
  public static getArchive(path: string): Zip {
    var ext: string = ArchiveUtils.getExt(path);
    if (ext in ArchiveUtils) {
      let descriptor: ArchiveDescriptor = ArchiveUtils.type[ext];
      return descriptor.getArchive(path);
    } else {
      throw new Error(ext + ' file are not supported')
    }
  }
  public static createArchive(path: string): Zip {
    var ext = ArchiveUtils.getExt(ext);
    var toto = {}

    if (ext in ArchiveUtils.type) {
      let descriptor: ArchiveDescriptor = ArchiveUtils.type[ext];
      return descriptor.createArchive(path);
    } else {
      throw new Error(ext + ' file are not supported')
    }
  }


  private static type: DescriptorStore = {
    zip: {
      getArchive(path: string) {
        return new Zip(path, true);
      },
      createArchive(path: string) {
        return new Zip(path);
      }
    }
  }

}

interface DescriptorStore {
  [key: string]: ArchiveDescriptor;
}

interface ArchiveDescriptor {
  getArchive(path: string): Zip
  createArchive(path: string): Zip
}


interface IArchiver {

}

export class Zip {
  private path: string
  private exist: boolean
  private zip: AdmZip
  constructor(path: string, exist?: boolean) {
    var me = this;
    me.path = path;
    me.exist = exist || false;
  }
  open() {
    var me = this;
    if (me.exist)
      me.zip = new AdmZip(me.path);
    else me.zip = new AdmZip();
    return me;
  }
  extract(where: string, entryPath: string) {
    var me = this;
    if (!me.zip) {
      return me;
    }
    me.zip.extractEntryTo(entryPath, where);
    return me;
  }
  extractAll(where: string) {
    var me = this;
    if (!me.zip) {
      return;
    }
    me.zip.extractAllTo(where);
    return;
  }
  getEntries(): Array<string> {
    var me = this;
    if (!me.zip) {
      return [];
    }
    var zipEntries = me.zip.getEntries();
    var data: Array<string> = [];
    zipEntries.forEach(function (zipEntry) {
      data.push(zipEntry.entryName);
    });
    return data;
  }
  readEntry(entryPath: string) {
    var me = this;
    if (!me.zip) {
      return "fail";
    }
    return me.zip.readFile(entryPath);
  }
  readEntryAsText(entryPath: string) {
    var me = this;
    if (!me.zip) {
      return "fail";
    }
    return me.zip.readAsText(entryPath);
  }
  addFile(path: string, buffer: string | Buffer) {
    var me = this;
    if (!me.zip) {
      return me;
    }
    me.zip.addFile(path, typeof buffer == "string" ? new Buffer(buffer) : buffer);
    return me;
  }
  addLocalFile(path: string) {
    var me = this;
    if (!me.zip) {
      return me;
    }
    me.addLocalFile(path);
    return me;
  }
  write(path: string) {
    var me = this;
    if (!me.zip) {
      return;
    }
    me.zip.writeZip(path);
  }
}