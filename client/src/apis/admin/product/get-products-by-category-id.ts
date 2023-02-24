import axios from "axios";

export const getProductsByCategoryIdApi = (id: string, page: number) => {
    return axios
      .get(`${process.env.REACT_APP_API}admin/products/category/${id}/${page}`)
      .then(function (response) {
          console.log("get product by id success", response);
          return response.data;
      });
  };

  export default getProductsByCategoryIdApi;