db=require('../config/connection')
const { response } = require('../app');
const { PRODUCT_COLLECTION } = require('../config/collections');
var collection=require('../config/collections')
const objectId = require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        
       
        db.get().collection('product').insertOne(product).then((data)=>{
           
          callback(data.insertedId)
        })
    }, 
    getAllProducts:()=>{
        return new Promise(async (resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    getProductDetails:(id)=>{
        return new Promise(async (resolve, reject) => {
            let productOne=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({
                _id : objectId(id)})
               
                resolve(productOne)
        })
    },
    getCartProductList:(id)=>{
        return new Promise((resolve, reject) => {
            let cart=db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(id)})
            resolve(cart.products)
        })

    },
    editProducts:(product)=>{

        return new Promise((resolve, reject) => {
           

            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(product.productId)},{
               $set:{
                  name:product.name,
                  category:product.category,
                  price:product.price,
                  details:product.details,

               }
            }).then((response)=>{
                
                resolve(objectId(product.productId))
            }
            )

            })

    }

}