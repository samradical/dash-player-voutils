const _ = require('lodash')

let VIDEO_VO = {
  currentRefIndexs: null,
  currentRefDuration: 0,
  watchedRefs: null,
  timelineTotal: 0,
  type: null, //audio, video
  referencesLength: undefined,
  manifest:null
}

const getTypeFromUUID = (uuid) => {
  return uuid.split(':')[0]
}

const getUUID = (type, videoId, resolution) => {
  let _res = type === 'video' ? resolution : 'audio'
  return `${type}:${videoId}:${_res}`
}

const generateVideoVo = (uuid) => {
  let _vo = _.clone(VIDEO_VO)
  _vo.currentRefIndexs = Array(0)
  _vo.currentRefIndexs.push(-1)
  _vo.uuid = uuid
  _vo.type = getTypeFromUUID(uuid)
  _vo.watchedRefs = new Set()
  return _vo
}

const addManifestToVideoVo = (manifest, videoVo) => {
  let { sidx } = manifest
  let { references } = sidx
  if (!manifest || !sidx) {
    let _err = new Error('No Manifest')
    _err.name = ERROR_TYPES.VIDEO_VO
    throw _err
    return
  }
  videoVo.manifest = manifest
  videoVo.referencesLength = references.length
}

 const incrementRefIndex = (vo, amount = 1, callback)=> {
    let _refs = vo.currentRefIndexs
    let _firstRefIndex = _refs[_refs.length - 1] + 1
    vo.currentRefIndexs = [...Array(amount).keys()]
      .map(i => {
        return i + _firstRefIndex
      }).filter(index => {
        //make all the indexs greater than the length false
        return (index < vo.referencesLength)
      })

    //too many, so do something, will already be finishing the last, no time
    if (!vo.currentRefIndexs.length) {
      callback(vo)
    }
  }

const generateMediaSourceVo = (vo, options = {}) => {
  let { manifest } = vo
  let { sidx } = vo.manifest
  let { references } = sidx
  if (!vo.manifest || !sidx) {
    let _err = new Error('No Manifest')
    _err.name = ERROR_TYPES.VIDEO_VO
    throw _err
    return
  }
  let { currentRefIndexs } = vo
  let startIndex = currentRefIndexs[0] || 0
  let endIndex = currentRefIndexs[currentRefIndexs.length - 1]
  let sRef = references[startIndex]
  let eRef = references[endIndex]
  var size = 0;
  var duration = 0;
  for (var j = startIndex; j <= endIndex; j++) {
    duration += references[j]['durationSec'];
    size += references[j].size;
  }
  var brEnd = (parseInt(eRef['mediaRange'].split('-')[1], 10));
  var brMax = brEnd;
  var mediaSourceVo = {};
  mediaSourceVo['url'] = manifest['url'] || manifest.baseUrl;
  mediaSourceVo['byteRange'] = sRef['mediaRange'].split('-')[0] + '-' + brEnd;
  mediaSourceVo['byteLength'] = size;
  mediaSourceVo['codecs'] = manifest['codecs'];
  mediaSourceVo['firstOffset'] = sidx['firstOffset'];
  mediaSourceVo.indexRange = manifest.indexRange;
  mediaSourceVo.indexLength = sidx.firstOffset;
  mediaSourceVo['timestampOffset'] = sRef['startTimeSec'];
  mediaSourceVo['duration'] = duration;
  /*_.forIn(options, (val, key) => {
    mediaSourceVo[key] = val;
  })
  if(!manifest.youtubeDl){
    mediaSourceVo.url += '&range=' + mediaSourceVo.byteRange;
  }
  console.log(mediaSourceVo);*/
  mediaSourceVo.videoId = manifest.videoId;
  mediaSourceVo.id = manifest.id || mediaSourceVo.videoId
  mediaSourceVo.indexUrl = mediaSourceVo.url + `?range=${mediaSourceVo.indexRange}`
  mediaSourceVo.rangeUrl = mediaSourceVo.url + `?range=${mediaSourceVo.byteRange}`
  return mediaSourceVo;
}

module.exports = {
  getUUID,
  incrementRefIndex,
  generateMediaSourceVo,
  generateVideoVo,
  addManifestToVideoVo
}