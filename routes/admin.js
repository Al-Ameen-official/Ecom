var express = require('express');

var router = express.Router();

var productHelpers = require('../helpers/product-helpers')
/* GET products */
router.get('/', function (req, res,next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/admin', { admin: true,products });
  })
  
});
router.get('/add-products', function (req, res,next) {
  res.render('admin/add-product',{ admin: true});
});
router.post('/add-products', function (req, res,next) {


  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.img
    console.log(req.body);
    image.mv('./public/product-images/'+id+'.jpg',(err, done)=>{
      if (!err) {
        res.render("admin/add-product")
      } else {
              console.log(err);
      }
    })

  })

});
router.get('/edit-products',function(req, res,next) {
  res.render('admin/edit-product',{admin:true});
});
// router.get('/view-users', function(req, res) {
//   res.render('admin/view-users');
// });

module.exports = router;
