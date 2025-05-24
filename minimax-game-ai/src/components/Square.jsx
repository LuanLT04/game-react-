import "./Square.scss";
import { motion } from "framer-motion";

const Square = ({ ind, updateSquares, clsName, disabled }) => {
    const handleClick = () => {
        if (!disabled) {
            updateSquares(ind);
        }
    };
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`square${disabled ? " square--disabled" : ""}`}
            onClick={handleClick}
            style={disabled ? { pointerEvents: "none", opacity: 0.5 } : {}}
        >
            {clsName && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={clsName}
                ></motion.span>
            )}
        </motion.div>
    );
};

export default Square;
