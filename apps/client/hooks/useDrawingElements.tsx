import { HTTP_URL } from "@/lib/config";
import { element_type } from "@/lib/types";
import axios from "axios";
import { useEffect, useState } from "react";

export const useDrawingElements = (
  roomId: string
): [boolean, element_type[]] => {
  const [isLoading, setIsLoading] = useState(true);
  const [elements, setElements] = useState<element_type[]>([]);
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const response = await axios.get(HTTP_URL + "/elements/" + roomId, {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        });
        try {
          const dataArr = new Array(...response.data);
          const fetchedElements = dataArr.map((data) => {
            return { ...JSON.parse(data.element_data), dbId: data.id };
          });
          setElements(fetchedElements.sort((a, b) => a.id - b.id));
        } catch (err) {
          console.log("Error Parsing", err);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExistingData();
  }, [roomId]);
  return [isLoading, elements];
};
