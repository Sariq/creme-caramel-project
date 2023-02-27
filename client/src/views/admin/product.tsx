import clsx from "clsx";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TProduct } from "shared/types/product";

/*consts*/
import { CategoryEnum, CategoryConsts } from "shared/constants";

/* api */
import addNewProductApi from "apis/admin/product/add-new-product";
import uploadImage from "apis/admin/product/upload-image";
import getProductApi from "apis/admin/product/get-product";
import getCategoriesListApi from "apis/admin/category/get-categories";
import { TCategory } from "shared/types/category";
import React from "react";

const iconClass =
  "text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-full";
const inputClass =
  "border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 rounded  shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150";
const inputLabelClass =
  "block text-lg uppercase text-blueGray-600 font-bold mb-2";

const formModes = {
  preview: 1,
  edit: 2,
  addNew: 3,
};
const ProductPage = () => {
  const params = useParams();
  const [selectedProduct, setSelectedProduct] = useState<TProduct>();
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<number>();
  const [imgFile, setImgFile] = useState<File>();
  const [isLoading, setIsLoading] = useState<boolean>();
  const navigate = useNavigate();

  const [categorytList, setCategorytList] = useState<TCategory[]>([]);
  useEffect(() => {
    getCategoriesListApi().then((res) => {
      console.log(res);
      setCategorytList(res);
    });
  }, []);

  useEffect(() => {
    if (params.id === undefined) {
      setFormMode(formModes.addNew);
    } else {
      getProductApi(params.id).then((res) => {
        setSelectedProduct(res);
        setFormMode(formModes.preview);
      });
    }
  }, []);

  useEffect(() => {
    switch (formMode) {
      case formModes.edit:
        setIsDisabled(false);
        break;
      case formModes.addNew:
        setIsDisabled(false);
        break;
      case formModes.preview:
        setIsDisabled(true);
        break;
      default:
        break;
    }
  }, [formMode]);

  const handlEditClick = () => {
    if (formMode === formModes.edit) {
      setFormMode(formModes.preview);
      return;
    }
    setFormMode(formModes.edit);
  };

  const handlAddClick = () => {
    if (selectedProduct && imgFile) {
      setIsLoading(true);
      //uploadImage(imgFile).then((res) => {
        console.log("imgFile",imgFile)
        const updatedData = { ...selectedProduct, img: imgFile };
        setSelectedProduct(updatedData);
        addNewProductApi(updatedData).then((res: any) => {
          console.log(res);
          navigate(`/admin/product/${res.productId}`);
          setIsLoading(false);
        });
      //});
    }
  };

  const handleFileChange = (event: any) => {
    const target = event.target;
    console.log("event.target.files[0]",event.target.files[0])
    setImgFile(event.target.files[0]);
  };

  const handleInputChange = (event: any) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    setSelectedProduct({ ...selectedProduct, [name]: value });
  };

  const getInputClass = () => {
    switch (formMode) {
      case formModes.edit:
        return "bg-white";
      case formModes.addNew:
        return "bg-white";
      case formModes.preview:
        return "bg-blueGray-100";
      default:
        return "";
    }
  };

  const getCardTitle = () => {
    switch (formMode) {
      case formModes.edit:
        return "ערוך מוצר";
      case formModes.addNew:
        return "הוסף מוצר";
      case formModes.preview:
        return "פרטי מוצר";
      default:
        return "";
    }
  };

  const getImgSrc = () => {
    switch (formMode) {
      case formModes.addNew:
        return URL.createObjectURL(imgFile);
      case formModes.preview:
      case formModes.edit:
        return selectedProduct?.img;
      default:
        return "";
    }
  };

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-100 border-0">
        {isLoading && false && (
          <div className="absolute w-full h-full opacity-60 z-10 bg-gray-900">
            <div
              role="status"
              className="w-full h-full grid content-center		justify-center	"
            >
              <svg
                aria-hidden="true"
                className=" mr-2 w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
        <div className="rounded-t bg-white mb-0 px-6 py-6">
          <div className="text-center flex justify-between">
            <h6 className="text-blueGray-700 text-xl font-bold">
              {getCardTitle()}
            </h6>
            <div>
              {formMode !== formModes.addNew && (
                <div
                  onClick={handlEditClick}
                  role="button"
                  className={clsx("bg-orange-600 disabled", iconClass)}
                >
                  <i
                    className={clsx(
                      formMode === formModes.edit
                        ? "fas fa-check"
                        : "fas fa-edit"
                    )}
                  ></i>
                </div>
              )}
              {formMode === formModes.addNew && (
                <div
                  onClick={handlAddClick}
                  role="button"
                  className={clsx("bg-orange-600 disabled", iconClass)}
                >
                  <i className={clsx("fas fa-check")}></i>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-auto px-4 lg:px-10 py-10 pt-5">
          <form
            className={clsx(
              isDisabled ? "pointer-events-none" : "pointer-events-auto"
            )}
          >
            <div className="flex flex-wrap">
              <div className="w-full lg:w-6/12 px-4">
                <div className="relative w-full mb-3">
                  <label className={inputLabelClass} htmlFor="grid-password">
                    שם
                  </label>
                  <input
                    name="name"
                    type="text"
                    className={clsx(inputClass, getInputClass())}
                    defaultValue={selectedProduct?.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="w-full lg:w-6/12 px-4">
                <div className="relative w-full mb-3">
                  <label className={inputLabelClass} htmlFor="grid-password">
                    קטגוריה
                  </label>
                  <select
                    name="categoryId"
                    className={clsx("pr-12", inputClass, getInputClass())}
                    value={selectedProduct?.categoryId}
                    onChange={handleInputChange}
                  >
                    <option value="" selected disabled hidden>
                      בחר קטיגוריה
                    </option>
                    {categorytList?.map((category) => (
                      <option value={category?._id}>
                        <span>{category?.name}</span>
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="w-full lg:w-6/12 px-4">
                <div className="relative w-full mb-3">
                  <label className={inputLabelClass} htmlFor="grid-password">
                    מחיר
                  </label>
                  <input
                    name="price"
                    type="number"
                    className={clsx(inputClass, getInputClass())}
                    defaultValue={selectedProduct?.price}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap">
              <div className="w-full lg:w-12/12 px-4">
                <div className="relative w-full mb-3">
                  <label className={inputLabelClass} htmlFor="grid-password">
                    תיאור מוצר
                  </label>
                  <textarea
                    name="description"
                    role="textbox"
                    className={clsx(inputClass, getInputClass())}
                    defaultValue={selectedProduct?.description}
                    rows={4}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap">
              <div className="w-full lg:w-12/12 px-4">
                <div className="relative w-full mb-3">
                  <label className={inputLabelClass} htmlFor="grid-password">
                    הוסף תמונה
                  </label>
                  <div className="flex justify-center items-center w-full border rounded  shadow">
                    {imgFile || selectedProduct?.img ? (
                      <div>
                        <img className="w-80 h-60" src={getImgSrc()} />
                      </div>
                    ) : (
                      <label
                        htmlFor="dropzone-file"
                        className="flex flex-col justify-center items-center h-64 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                      >
                        <div className="flex flex-col justify-center items-center pt-5 pb-6 w-80 h-60">
                          <svg
                            aria-hidden="true"
                            className="mb-3 w-10 h-10 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            ></path>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">בחר תמונה</span>{" "}
                          </p>
                        </div>
                        <input
                          name="img"
                          id="dropzone-file"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default ProductPage;
