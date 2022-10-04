// components
import CardSettings from "components/Cards/CardSettings.js";
import ProductItem from "./product";
export default function ProductsList() {
  const productList: any[] = require("../../mocks/products.json");
  console.log(productList)
  return (
    <>
      <div className="flex flex-wrap justify-center relative">
        <div className="w-full lg:w-8/12 px-4">
          <div className="">
            {productList.map((product) => (
              <div>{product.name}</div>
            ))}
          </div>
          <ProductItem/>
          <CardSettings />
        </div>
      </div>
    </>
  );
}
