const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = 3000;

const CONTAINER_NAME = "sanaei-panel";
const IMAGE_NAME = "sanaei-panel:latest";

const SANEAI_DOCKERFILE =
    "https://raw.githubusercontent.com/padarham9-ui/V2/refs/heads/main/XV2/BM/Dackerfile";

const BUILD_DIR = "/tmp/sanaei-build";

app.use(express.json());

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});

function command(cmd, args = []) {

    return new Promise((resolve, reject) => {

        const process =
            spawn(cmd, args);

        let output = "";
        let error = "";

        process.stdout.on(
            "data",
            data => {
                output += data.toString();
            }
        );

        process.stderr.on(
            "data",
            data => {
                error += data.toString();
            }
        );

        process.on("close", code => {

            if (code === 0) {

                resolve(output);

            } else {

                reject(
                    new Error(
                        error || output ||
                        `Process exited with ${code}`
                    )
                );

            }

        });

    });

}

app.post("/api/create", async (req, res) => {

    try {

        fs.mkdirSync(
            BUILD_DIR,
            {
                recursive: true
            }
        );

        /*
         * دریافت Dockerfile سنایی
         */

        await command(
            "curl",
            [
                "-L",
                SANEAI_DOCKERFILE,
                "-o",
                `${BUILD_DIR}/Dockerfile`
            ]
        );

        /*
         * حذف کانتینر قبلی
         */

        try {

            await command(
                "docker",
                [
                    "rm",
                    "-f",
                    CONTAINER_NAME
                ]
            );

        } catch {}

        /*
         * حذف Image قبلی
         */

        try {

            await command(
                "docker",
                [
                    "rmi",
                    "-f",
                    IMAGE_NAME
                ]
            );

        } catch {}

        /*
         * Build
         */

        await command(
            "docker",
            [
                "build",
                "-t",
                IMAGE_NAME,
                BUILD_DIR
            ]
        );

        /*
         * Run
         */

        await command(
            "docker",
            [
                "run",
                "-d",
                "--name",
                CONTAINER_NAME,
                "--restart",
                "unless-stopped",
                "-p",
                "0:8080",
                IMAGE_NAME
            ]
        );

        res.json({

            success: true,

            username: "admin",

            password: "admin"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on ${PORT}`
        );

    }
);
