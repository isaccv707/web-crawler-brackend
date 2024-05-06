import 'dotenv/config';

//Esta línea importa la función get de la biblioteca env-var, que se utilizará para acceder 
//a las variables de entorno y realizar algunas validaciones sobre ellas.
import {get} from 'env-var';


export const envs = {
   PORT: get('PORT').required().asPortNumber(),
}