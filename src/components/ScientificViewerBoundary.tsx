'use client';
import {Component} from 'react';
import type {ReactNode} from 'react';

type Props={children:ReactNode;tool:string};
type State={failed:boolean};
/** Keep failures in third-party editors from crashing the entire research UI. */
export default class ScientificViewerBoundary extends Component<Props,State>{
  state:State={failed:false};
  static getDerivedStateFromError():State{return {failed:true};}
  componentDidCatch(error:Error){
    // Do not log uploaded molecular structures, credentials, or user-authored notes.
    console.error('Scientific visualization failed:',error.name);
  }
  render(){
    if(this.state.failed)return <div className="hl-alert hl-error" role="alert">
      {this.props.tool} could not initialize. Other scientific tools remain available.
      <button className="ghostButton" onClick={()=>this.setState({failed:false})}>Try again</button>
    </div>;
    return this.props.children;
  }
}
