import { useEffect, useState, useContext } from "react";
import {
  ApolloClient,
  NormalizedCacheObject,
  useApolloClient,
} from "@apollo/client";
import { posts, post, revision, Post, PostIdType } from "./services";
import {
  base64Decode,
  base64Encode,
  getQueryParam,
  isServerSide,
} from "../utils";
import { Context } from "../context";

function useApi<R = any>(
  service: typeof posts | typeof post | typeof revision,
  ...args: any[]
): R | undefined {
  const [result, setResult] = useState<R>();
  const client = useApolloClient();

  useEffect(() => {
    let subscribed = true;
    if (client) {
      void (async () => {
        const p = (await (service as (
          client: ApolloClient<NormalizedCacheObject>,
          ...a: any[]
        ) => Promise<any>)(
          client as ApolloClient<NormalizedCacheObject>,
          ...args
        )) as R;

        if (subscribed) {
          setResult(p);
        }
      })();
    }

    return () => {
      subscribed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, service, ...args]);

  return result;
}

export function usePosts() {
  return useApi<Post[]>(posts);
}

export function usePostByType(uid: string | number, idType?: PostIdType) {
  return useApi<Post>(post, uid, idType);
}

function useRevision(id: string) {
  return useApi<Post>(revision, id);
}

/* eslint-disable react-hooks/rules-of-hooks */
export function usePost(uid?: string) {
  const { pageInfo } = useContext(Context);

  if (!uid && !!pageInfo) {
    return usePostByType(
      base64Encode(`post:${pageInfo.post_id}`),
      PostIdType.ID
    );
  }

  if (!uid) {
    return undefined;
  }

  const decoded = base64Decode(uid) || "";
  const status = isServerSide()
    ? ""
    : getQueryParam(window.location.search, "status");

  if (decoded.indexOf("post:") === 0) {
    if (status === "inherit") {
      return useRevision(decoded.split(":")[1]);
    }

    return usePostByType(uid, PostIdType.ID);
  }

  return usePostByType(uid, PostIdType.SLUG);
}
/* eslint-enable react-hooks/rules-of-hooks */
