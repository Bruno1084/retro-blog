import { TYPE_LABEL, TYPE_ORDER } from '@/lib/content/labels';
import styles from './document.module.css';

/** Tabla fija de los tres tipos de documento, para /about. Sale de `TYPE_LABEL`. */
export function DocTypes() {
  return (
    <section className={styles.types} aria-labelledby="tipos-title">
      <h2 id="tipos-title">Tipos de documento</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Tipo</th>
            <th scope="col">Qué es</th>
          </tr>
        </thead>
        <tbody>
          {TYPE_ORDER.map((type) => (
            <tr key={type}>
              <th scope="row">{TYPE_LABEL[type].singular}</th>
              <td>{TYPE_LABEL[type].description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
