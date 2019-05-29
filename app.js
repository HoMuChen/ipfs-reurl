function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str);
}

const app = new Vue({
  el: '#app',
  data: {
    ipfs: {
      node: null,
      id: '',
      peers: 0,
      updateInterval: 3000,
    },
    mode: 'url',
    url: '',
    file: null,
    isDisplayingHash: false,
    hash: '',
  },
  computed: {
    isShowUrl: function() {
      return this.mode === 'url';
    },
    isShowImage: function() {
      return this.mode === 'image';
    },
    urlScript: function() {
      return `<script>window.location="${this.url}"</script>`
    },
    reurl: function() {
      return `https:\/\/ipfs.io/ipfs/${this.hash}`;
    },
    peersPercentage: function() {
      return (this.ipfs.peers / 8) * 100;
    }
  },
  methods: {
    handleSelect: function(key, keyPath) {
      this.mode = key;
      this.setDisplayingHash(false);
    },
    changeMode: function(mode) {
      this.mode = mode;
      console.log(this.ipfs.node);
    },
    setDisplayingHash: function(v) {
      this.isDisplayingHash = v;
    },
    handleUrlInputChange: function(e) {
      this.url = e.target.value;
    },
    handleAddUrlToIpfs: function(e) {
      if(!this.isIpfsReady()) {
        return;
      }

      if(!isURL(this.url)) {
        this.$message({
          message: 'Url is invalid...',
          type: 'warning',
        })
        return;
      }

      this.ipfs.node.add(Ipfs.Buffer.from(this.urlScript))
        .then(res => {
          this.hash = res[0].hash;
          this.setDisplayingHash(true);
          this.url = '';
          this.$message({
            message: 'Success！',
            type: 'success',
          })
        })
        .catch(e => {
          this.error = e.massage;
        })
    },
    updateIpfsStatus: function() {
      this.ipfs.node.swarm.peers().then(data => {
        this.ipfs.peers = data.length;
      })
    },
    handleFiles: function(e) {
      this.file = e.target.files[0];
    },
    addFileToIpfs: function() {
      if(!this.isIpfsReady()) {
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        const content =  Ipfs.Buffer.from( e.srcElement.result );
        this.ipfs.node.add(content)
          .then(res => {
            this.hash = res[0].hash;
            this.setDisplayingHash(true);
            this.$message({
              message: 'Success！',
              type: 'success',
            })
          })
      }
      reader.readAsArrayBuffer(this.file);
    },
    copyToClipboard: function() {
      const el = document.createElement('textarea');
      el.value = this.reurl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.$message({
        message: 'Copy to clipboard succeessfully',
        type: 'success',
      })
    },
    isIpfsReady: function() {
      if(this.ipfs.peers === 0) {
        this.$message({
          message: 'Ipfs is not ready, please wait...',
          type: 'warning',
        })
        return false;
      }else {
        return true;
      }
    },
  },
  created: function() {
    const options = {
      EXPERIMENTAL: {
        pubsub: true
      },
      //repo: 'ipfs-' + Math.random(),
      config: {
        Addresses: {
          Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
        }
      }
    }
    this.ipfs.node = new Ipfs(options);
    this.ipfs.node.on('ready', () => {
      this.ipfs.node.id().then(data => this.ipfs.id = data.id);
      setInterval(this.updateIpfsStatus, this.ipfs.updateInterval)
    })
  }
})
