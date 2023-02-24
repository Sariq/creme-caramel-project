import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

// components
import { useEffect, useState } from "react";
import clsx from "clsx";
import getProductsListApi from "apis/admin/product/get-products-list";
import deleteProductApi from "apis/admin/product/delete-product";
import getProductsByCategoryIdApi from "apis/admin/product/get-products-by-category-id";
import { CategoryConsts, CategoryEnum } from "shared/constants";

const iconClass =
  "text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full";
export default function ProductsList() {
  const params = useParams<any>();
  const navigate = useNavigate();

  const [productsList, setProductsList] = useState<any>();
  const [isDeleteActive, setIsdeleteActive] = useState(false);
  const [deleteList, setDeleteList] = useState<any>([]);
  // if(params.id){

  //   const categoryName= CategoryConsts[CategoryEnum.cheeseCake];
  // }
  const getProductsList = () => {
    getProductsListApi(1).then((res) => {
      setProductsList(res);
    });
  };
  useEffect(() => {
    if (params.id) {
      // setInterval(() => {
        getProductsByCategoryIdApi((params.id), 1).then((res) => {
          setProductsList(res);
        });
    //   }, 1000);
    // } else {
    //   setInterval(() => {
    //     getProductsList();
    //   }, 1000);
    }
  }, []);

  const getCategoryName = () => {
    if (params.id) {
      switch (params.id) {
        case "1":
          return CategoryConsts[ CategoryEnum.cheeseCake]
        case "2":
          return CategoryConsts[ CategoryEnum.chockolateCate]
        case "3":
          return CategoryConsts[ CategoryEnum.uniqueCake]
        case "4":
          return CategoryConsts[ CategoryEnum.birthdayCake]
      }
    }
  };

  const handleProductClick = (e: any, product: any) => {
    if (isDeleteActive) {
      e.preventDefault();
      if (isInDeleteList(product)) {
        const updatedDeleteList = deleteList.filter(
          (id: any) => id !== product._id
        );
        setDeleteList(updatedDeleteList);
      } else {
        setDeleteList([...deleteList, product._id]);
      }
    }
  };

  const isInDeleteList = (product: any) => {
    return deleteList.indexOf(product._id) > -1;
  };

  const deleteSelectedItems = () => {
    setIsdeleteActive(false);
    deleteProductApi(deleteList);
    //TODO : call delete products api
  };

  const handleDeleteItemsClick = () => {
    if (isDeleteActive) {
      setDeleteList([]);
    }
    setIsdeleteActive(!isDeleteActive);
  };

  const handleAddNewClick = () => {
    navigate("/admin/product");
  };

  if (!productsList) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-center relative">
      <div className="w-full px-4">
        <div
          className={clsx(
            "flex items-center rounded-lg rounded p-3 shadow-lg bg-gray-100",
            isDeleteActive ? "bg-red-300" : "bg-white"
          )}
        >
          <div
            onClick={deleteSelectedItems}
            role="button"
            className={clsx(
              "bg-orange-600 disabled",
              iconClass,
              isDeleteActive ? "visible" : "invisible",
              deleteList.length === 0
                ? "opacity-30 pointer-events-none"
                : "opacity-100 pointer-events-auto"
            )}
          >
            <i className="fas fa-check"></i>
          </div>
          <h1 className="text-4xl m-auto w-fit">{getCategoryName()}</h1>
          <div className="flex gap-3">
            <div
              role="button"
              onClick={handleDeleteItemsClick}
              className={clsx(iconClass, "bg-red-600")}
            >
              <i
                className={clsx(
                  isDeleteActive ? "fa fa-times" : "fas fa-trash"
                )}
              ></i>
            </div>
            <div
              role="button"
              onClick={handleAddNewClick}
              className={clsx(
                "bg-lightBlue-600 disabled",
                iconClass,
                isDeleteActive
                  ? "opacity-30 pointer-events-none"
                  : "opacity-100 pointer-events-auto"
              )}
            >
              <i className="fas fa-plus"></i>
            </div>
          </div>
        </div>
        <div className="flex gap-5 flex-wrap mt-10 -mx-1 lg:-mx-4">
          {productsList.map((product: any) => (
            <Link
              onClick={(e) => {
                handleProductClick(e, product);
              }}
              className={clsx("my-1 transition duration-500 hover:scale-105")}
              to={`/admin/product/${product._id}`}
            >
              <div>
                <article className="overflow-hidden rounded-lg shadow-lg">
                  <img
                    alt="Placeholder"
                    className="block  w-80 h-40"
                    src={`${product.img}`}
                  />
                  <div
                    className={clsx(
                      "flex items-center leading-tight p-2 md:p-4",
                      isDeleteActive && isInDeleteList(product)
                        ? "bg-red-600"
                        : "bg-white"
                    )}
                  >
                    <div className="text-lg w-full text-center">
                      <span className="text-black	">{product.name}</span>
                    </div>
                  </div>
                </article>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
