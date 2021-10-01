const express = require("express");
const faceapi = require("face-api.js");
const { Canvas, Image } = require("canvas");
const canvas = require("canvas");
const fileUpload = require("express-fileupload");
const config = require("./config/db.config");
const db = require("./models");
const UsersSmarterp = db.users_smarterp;
const cors = require("cors");
faceapi.env.monkeyPatch({ Canvas, Image });
TZ = 'Asia/Jakarta'

const app = express();
var corsOptions = {
  origin: config.URL
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

async function LoadModels() {
  await faceapi.nets.faceRecognitionNet.loadFromDisk(__dirname + "/models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk(__dirname + "/models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + "/models");
}
LoadModels();

app.post("/post-face", async (req, res) => {
  const facedata = req.files.facedata.tempFilePath;
  const iduser = req.body.iduser
  let result = await uploadLabeledImages(facedata, iduser);
  res.json(result);
})


async function uploadLabeledImages(images, iduser) {
  var responseTemp = new Array();
  const img = await canvas.loadImage(images);
  console.log(`Progress Uploading ...`);
  const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  // console.log(detections.descriptor)
  var resUsersSmarterp = await UsersSmarterp.findOne({ where: { user_id: iduser } }).then(async data => {
    if (data) {
      var facedata = "[" + detections.descriptor.toString() + "]";
      let values = {
        facedata: facedata
      }
      await UsersSmarterp.update(values, { where: { user_id: iduser } });
      responseTemp = {
        status: true,
        message: "Berhasil"
      }
    } else {
      responseTemp = {
        status: false,
        message: "Data user tidak ditemukan"
      }
    }
    return responseTemp;
  }).catch(err => {
    responseTemp = {
      status: false,
      message: err.message
    }
    return responseTemp
  });
  return resUsersSmarterp;
}

app.post("/check-face", async (req, res) => {

  const facedata = req.files.facedata.tempFilePath;
  const iduser = req.body.iduser
  let result = await getDescriptorsFromDB(facedata, iduser);
  res.json(result);

});

async function getDescriptorsFromDB(image, iduser) {
  var resUsersSmarterp = await UsersSmarterp.findOne({ where: { user_id: iduser } }).then(async data => {
    if (data) {
      responseTemp = {
        status: true,
        message: "Berhasil",
        data: data
      }
    } else {
      responseTemp = {
        status: false,
        message: "Data user tidak ditemukan"
      }
    }
    return responseTemp;
  }).catch(err => {
    responseTemp = {
      status: false,
      message: err.message
    }
    return responseTemp
  });

  if (resUsersSmarterp.status) {
    var facesArrayFloat32 = new Array();
    var faces = resUsersSmarterp.data.facedata;
    var faces = faces.replace('[', '');
    var faces = faces.replace(']', '');
    const facesArray = faces.split(",");
    for (j = 0; j < facesArray.length; j++) {
      var faceFloat32 = facesArray[j];
      facesArrayFloat32.push(faceFloat32);
    }

    var facesLabelFace = [{
      label: iduser,
      descriptions: facesArrayFloat32
    }];
    for (i = 0; i < facesLabelFace.length; i++) {
      // Change the face data descriptors from Objects to Float32Array type
      for (j = 0; j < facesLabelFace[i].descriptions.length; j++) {
        facesLabelFace[i].descriptions[j] = new Float32Array(Object.values(facesLabelFace[i].descriptions[j]));
      }
      facesLabelFace[i] = new faceapi.LabeledFaceDescriptors(facesLabelFace[i].label, facesLabelFace[i].descriptions);
    }

    const faceMatcher = new faceapi.FaceMatcher(facesLabelFace);
    // Read the image using canvas or other method
    const img = await canvas.loadImage(image);
    let temp = faceapi.createCanvasFromMedia(img);
    const displaySize = { width: img.width, height: img.height };
    faceapi.matchDimensions(temp, displaySize);

    // Find matching faces
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
    // const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = detections.map((d) => faceMatcher.findBestMatch(d.descriptor));
    if (results) {
      responseTemp = {
        status: true,
        message: "Berhasil"
      }
    } else {
      responseTemp = {
        status: false,
        message: "Wajah tidak cocok"
      }
    }
    return responseTemp;
  } else {
    return resUsersSmarterp;
  }


}









const PORT = process.env.PORT || 8081;
process.env.TZ = "Asia/Jakarta";
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});