import axios from "axios";

export const getProductApi = (id: string) => {
    return axios
      .get(`${process.env.REACT_APP_API}admin/product/${id}`)
      .then(function (response) {
          console.log("get product success", response);
          return response.data;
      });
  };

  export default getProductApi;