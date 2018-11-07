
const SHA256 = require('crypto-js/sha256')
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

class Block {
  constructor (data) {
    this.hash = '',
    this.height = 0,
    this.body = data,
    this.time = 0,
    this.previousBlockHash = ''
  }
}



class Blockchain {
  constructor() {

    this.getBlockHeight().then((height) => {
      if (height === 0) {
        this.addGensis(new Block("Genesis block"))
      }
    })
  }


   async addGensis(GenesisBlock) {
   			GenesisBlock.height = 0
   			GenesisBlock.time = new Date().getTime().toString().slice(0,-3)
   			GenesisBlock.hash = SHA256(JSON.stringify(GenesisBlock)).toString()
        await this.addLevelDBData(GenesisBlock.height, JSON.stringify(GenesisBlock))
        console.log("Genesis block has been added")
   	}

  async addBlock(newBlock) {
    var height = await this.getBlockHeight()

    newBlock.height = height
    newBlock.time = new Date().getTime().toString().slice(0, -3)

    if (newBlock.height > 0) {
      const prevBlock = await this.getBlock(newBlock.height-1)
      newBlock.previousBlockHash = prevBlock.hash
      console.log('Block# '+(height)+' has been added');

    }

    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString()


    await this.addLevelDBData(newBlock.height, JSON.stringify(newBlock))
  }


  async getBlockHeight() {
    return await this.getBlockchainHeight()
  }


  async getBlock(blockHeight) {
    return JSON.parse(await this.getLevelDBData(blockHeight))
  }


  async validateBlock(blockHeight) {
    let block = await this.getBlock(blockHeight);
    let blockHash = block.hash;
    block.hash = '';

    let validBlockHash = SHA256(JSON.stringify(block)).toString();

    if (blockHash === validBlockHash) {
        return true;
      } else {
        console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
        return false;
      }
  }


  async validateChain() {
    let errorLog = []
    let previousHash = ''
    let length = await this.getBlockHeight()

    for (let i = 0; i < length; i++) {
      this.getBlock(i).then((block) => {
        // validate block
        if (!(this.validateBlock(i))) {
          errorLog.push(i)
        }
        // compare blocks hash link
        if (block.previousBlockHash !== previousHash) {
          errorLog.push(i)
        }
        previousHash = block.hash

        if (i === length-1) {
          if (errorLog.length > 0) {
            console.log('Block errors = ' + errorLog.length);
            console.log('Blocks: '+errorLog);
          } else {
            console.log('No errors detected')
          }
        }
      })
    }
  }

  async addLevelDBData(key, value) {
    return new Promise((resolve, reject) => {
      db.put(key, value, (error) => {
        if (error) {
          reject(error)
        }

        resolve(`Block added in DB successfully`)
      })
    })
  }

  async getLevelDBData(key) {
    return new Promise((resolve, reject) => {
      db.get(key, (error, value) => {
        if (error) {
          reject(error)
        }

        resolve(value)
      })
    })
  }

  async getBlockchainHeight() {
    return new Promise((resolve, reject) => {
      let height = 0
      db.createReadStream().on('data', (data) => {
        height++
      }).on('error', (error) => {
        reject(error)
      }).on('close', () => {
        resolve(height)
      })
    })
  }
}

///////////////////Testing////////////////////////////

let myBlockChain = new Blockchain();
(function theLoop (i) {
    setTimeout(function () {
        let blockTest = new Block("Test Block - " + (i + 1));
        myBlockChain.addBlock(blockTest).then((result) => {
          //  console.log(result);
            i++;
            if (i < 10) theLoop(i);
        });
    }, 10000);
  })(0);
